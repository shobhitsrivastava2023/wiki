"use client"

import { useState, useCallback, memo } from "react"
import dynamic from "next/dynamic"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import Homespace from "@/workspaces/Homespace"
import ArticleView from "../../../packages/components/article-view"
import DotMapsWorkspace from "@/workspaces/DotsMapWorkspace"

const Notebook = dynamic(() => import("../../../packages/components/Notebook"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-gray-400">Loading notebook...</div>
  ),
})

interface NotebookData {
  id: string
  title: string
  description?: string
  content?: string
  createdAt: Date
  updatedAt: Date
}

// Update the MemoizedHomespace component definition to include the new prop:
const MemoizedHomespace = memo(
  ({
    onCreateNotebook,
    onViewFullArticle,
    onToggleDotMaps,
    onSelectNotebook,
  }: {
    onCreateNotebook: (name: string, desc: string) => void
    onViewFullArticle: (title: string) => void
    onToggleDotMaps?: () => void
    onSelectNotebook?: (notebook: NotebookData) => void
  }) => {
    return (
      <Homespace
        onCreateNotebook={onCreateNotebook}
        onViewFullArticle={onViewFullArticle}
        onToggleDotMaps={onToggleDotMaps}
        onSelectNotebook={onSelectNotebook}
      />
    )
  },
)
MemoizedHomespace.displayName = "MemoizedHomespace"

export default function HomePage() {
  const [showNotebook, setShowNotebook] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const [description, setDescription] = useState("")
  const [notebookId, setNotebookId] = useState("")
  const [notebookContent, setNotebookContent] = useState("")
  const [viewingArticle, setViewingArticle] = useState(false)
  const [articleTitle, setArticleTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDotMaps, setShowDotMaps] = useState(false)
  const [isLoadingNotebook, setIsLoadingNotebook] = useState(false)

  const handleCreateNotebook = useCallback(async (name: string, desc: string) => {
    try {
      // Get user ID
      const userResponse = await fetch("/api/user")
      const userData = await userResponse.json()

      if (!userData.userId) {
        console.error("No user ID available")
        return
      }

      // Create notebook via API
      const response = await fetch("/api/notebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.userId,
          name,
          content: desc,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNotebookName(name)
        setDescription(desc)
        setNotebookId(result.id)
        setNotebookContent(`# ${name}\n\n${desc}\n\n## Notes\n\nStart typing your notes here...\n\n`)
        setShowNotebook(true)
      } else {
        console.error("Failed to create notebook:", result.error)
      }
    } catch (error) {
      console.error("Error creating notebook:", error)
    }
  }, [])

  const handleSelectNotebook = useCallback(async (notebook: NotebookData) => {
    setIsLoadingNotebook(true)
    try {
      // Fetch the full notebook data including content
      const { getNotebook } = await import("@/app/actions/saveNotebook")
      const result = await getNotebook(notebook.id)

      if (result.success && result.notebook) {
        setNotebookName(result.notebook.title)
        setDescription(result.notebook.description || "")
        setNotebookId(result.notebook.id)
        setNotebookContent(
          result.notebook.content ||
            `# ${result.notebook.title}\n\n${result.notebook.description || ""}\n\n## Notes\n\nStart typing your notes here...\n\n`,
        )
        setShowNotebook(true)
      } else {
        console.error("Failed to load notebook:", result.error)
      }
    } catch (error) {
      console.error("Error loading notebook:", error)
    } finally {
      setIsLoadingNotebook(false)
    }
  }, [])

  const handleViewFullArticle = useCallback((title: string) => {
    setIsLoading(true)
    setTimeout(() => {
      try {
        setArticleTitle(title)
        setViewingArticle(true)
      } catch (error) {
        console.error("Error transitioning to article view:", error)
        window.location.href = `/homespace?search=${encodeURIComponent(title)}`
      } finally {
        setIsLoading(false)
      }
    }, 100)
  }, [])

  const handleBackToSummary = useCallback(() => {
    setViewingArticle(false)
  }, [])

  const handleOpenDotMaps = useCallback(() => {
    setShowDotMaps(true)
  }, [])

  // Add a function to toggle DotMaps visibility
  const handleToggleDotMaps = useCallback(() => {
    setShowDotMaps(!showDotMaps)
  }, [showDotMaps])

  // Add a function to close DotMaps
  const handleCloseDotMaps = useCallback(() => {
    setShowDotMaps(false)
  }, [])

  // Add a function to close Notebook
  const handleCloseNotebook = useCallback(() => {
    setShowNotebook(false)
    // Reset notebook state
    setNotebookName("")
    setDescription("")
    setNotebookId("")
    setNotebookContent("")
  }, [])

  // Show loading state when loading notebook
  if (isLoadingNotebook) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#EEEEEE]">
        <div className="flex flex-col items-center">
          <div className="animate-spin text-3xl mb-3">⟳</div>
          <p className="text-lg">Loading notebook...</p>
        </div>
      </div>
    )
  }

  // When not showing the notebook or dotmaps, Homespace or ArticleView takes up the full screen
  if (!showNotebook && !showDotMaps) {
    if (isLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-[#EEEEEE]">
          <div className="flex flex-col items-center">
            <div className="animate-spin text-3xl mb-3">⟳</div>
            <p className="text-lg">Loading article...</p>
          </div>
        </div>
      )
    }

    return viewingArticle ? (
      // ArticleView will handle its own scrolling here
      <ArticleView title={articleTitle} onBack={handleBackToSummary} />
    ) : (
      // Homespace already handles its own scrolling (overflow-auto on its root div)
      <MemoizedHomespace
        onCreateNotebook={handleCreateNotebook}
        onViewFullArticle={handleViewFullArticle}
        onToggleDotMaps={handleToggleDotMaps}
        onSelectNotebook={handleSelectNotebook}
      />
    )
  }

  // When showing the notebook and dotmaps (three-panel view)
  if (showNotebook && showDotMaps) {
    return (
      <div className="h-screen w-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Notebook Panel */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full overflow-y-auto">
              <Notebook
                name={notebookName}
                description={description}
                onClose={handleCloseNotebook}
                notebookId={notebookId}
                initialContent={notebookContent}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* DotMaps Panel */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full overflow-hidden">
              <DotMapsWorkspace onSelectArticle={handleViewFullArticle} onClose={handleCloseDotMaps} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Article/Homespace Panel */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-[#EEEEEE]">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin text-3xl mb-3">⟳</div>
                    <p className="text-lg">Loading article...</p>
                  </div>
                </div>
              ) : viewingArticle ? (
                <ArticleView title={articleTitle} onBack={handleBackToSummary} />
              ) : (
                <MemoizedHomespace
                  onCreateNotebook={handleCreateNotebook}
                  onViewFullArticle={handleViewFullArticle}
                  onSelectNotebook={handleSelectNotebook}
                />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // When showing only the notebook or only dotmaps (split view)
  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel (Notebook or DotMaps) */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto">
            {showNotebook ? (
              <Notebook
                name={notebookName}
                description={description}
                onClose={handleCloseNotebook}
                notebookId={notebookId}
                initialContent={notebookContent}
              />
            ) : (
              <div className="h-full">
                <DotMapsWorkspace onSelectArticle={handleViewFullArticle} onClose={handleCloseDotMaps} />
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        {/* Article/Homespace Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center bg-[#EEEEEE]">
                <div className="flex flex-col items-center">
                  <div className="animate-spin text-3xl mb-3">⟳</div>
                  <p className="text-lg">Loading article...</p>
                </div>
              </div>
            ) : viewingArticle ? (
              <ArticleView title={articleTitle} onBack={handleBackToSummary} />
            ) : (
              <MemoizedHomespace
                onCreateNotebook={handleCreateNotebook}
                onViewFullArticle={handleViewFullArticle}
                onToggleDotMaps={handleToggleDotMaps}
                onSelectNotebook={handleSelectNotebook}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}


