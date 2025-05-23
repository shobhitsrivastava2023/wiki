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

// And update the MemoizedHomespace component definition to include the new prop:
const MemoizedHomespace = memo(
  ({
    onCreateNotebook,
    onViewFullArticle,
    onToggleDotMaps,
  }: {
    onCreateNotebook: (name: string, desc: string) => void
    onViewFullArticle: (title: string) => void
    onToggleDotMaps?: () => void
  }) => {
    return (
      <Homespace
        onCreateNotebook={onCreateNotebook}
        onViewFullArticle={onViewFullArticle}
        onToggleDotMaps={onToggleDotMaps}
      />
    )
  },
)
MemoizedHomespace.displayName = "MemoizedHomespace"

export default function HomePage() {
  const [showNotebook, setShowNotebook] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const [description, setDescription] = useState("")
  const [viewingArticle, setViewingArticle] = useState(false)
  const [articleTitle, setArticleTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDotMaps, setShowDotMaps] = useState(false)

  const handleCreateNotebook = useCallback((name: string, desc: string) => {
    setNotebookName(name)
    setDescription(desc)
    setShowNotebook(true)
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
  }, [])

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
              <Notebook name={notebookName} description={description} onClose={handleCloseNotebook} />
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
                <MemoizedHomespace onCreateNotebook={handleCreateNotebook} onViewFullArticle={handleViewFullArticle} />
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
              <Notebook name={notebookName} description={description} onClose={handleCloseNotebook} />
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
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}


