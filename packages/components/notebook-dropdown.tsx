"use client"

import { useState, useEffect } from "react"
import { Book, PlusCircle, ChevronDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

interface Notebook {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  content: string | null
}

interface NotebookDropdownProps {
  onCreateNotebook?: () => void
  onSelectNotebook?: (notebook: Notebook) => void
}

export function NotebookDropdown({ onCreateNotebook, onSelectNotebook }: NotebookDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Fetch user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/user")
        const data = await response.json()
        if (data.userId) {
          setUserId(data.userId)
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error)
      }
    }

    fetchUserId()
  }, [])

  // Fetch notebooks when dropdown opens or userId changes
  useEffect(() => {
    if (isOpen && userId && notebooks.length === 0) {
      fetchNotebooks()
    }
  }, [isOpen, userId])

  const fetchNotebooks = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { getUserNotebooks } = await import("@/app/actions/saveNotebook")
      const result = await getUserNotebooks(userId)

      if (result.success && result.notebooks) {
        setNotebooks(result.notebooks)
      }
    } catch (error) {
      console.error("Failed to fetch notebooks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotebookClick = (notebook: Notebook) => {
    if (onSelectNotebook) {
      onSelectNotebook(notebook)
    }
  }

  const handleCreateNotebook = () => {
    if (onCreateNotebook) {
      onCreateNotebook()
    }
  }

  // Refresh notebooks after creating a new one
  const refreshNotebooks = () => {
    setNotebooks([])
    if (isOpen && userId) {
      fetchNotebooks()
    }
  }

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto font-medium text-gray-700 hover:bg-transparent">
              <div className="flex items-center">
                <Book className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-md">Your Notebooks</span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </Button>
          </CollapsibleTrigger>

          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateNotebook}>
            <PlusCircle className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </Button>
        </div>

        <CollapsibleContent className="space-y-2">
          {loading ? (
            <div className="space-y-2 pl-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : notebooks.length > 0 ? (
            <div className="pl-6 space-y-1">
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleNotebookClick(notebook)}
                >
                  <FileText className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{notebook.title}</p>
                    {notebook.description && <p className="text-xs text-gray-500 truncate">{notebook.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pl-6 py-2">
              <p className="text-xs text-gray-500">No notebooks yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-1 text-xs text-indigo-600 hover:text-indigo-800"
                onClick={handleCreateNotebook}
              >
                Create your first notebook
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <p className="text-xs text-gray-500 mt-2">Create notebooks to organize your research</p>
    </div>
  )
}
