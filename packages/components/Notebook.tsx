"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Bold,
  Code,
  Eye,
  Frame,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Link,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import styles from "./Notebook.module.css"

interface NotebookProps {
  name: string
  description: string
  onClose?: () => void
  notebookId: string
  initialContent?: string
}

export default function Notebook({ name, description, onClose, notebookId, initialContent }: NotebookProps) {
  const [content, setContent] = useState(
    initialContent ||
      `# ${name || "Untitled Notebook"}

${description || "No description provided."}

## Notes

Start typing your notes here...

`,
  )
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [userId, setUserId] = useState<string | null>(null)

  // Load initial content when component mounts or when initialContent changes
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
    }
  }, [initialContent])

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const response = await fetch("/api/user")
        const data = await response.json()

        if (response.ok) {
          setUserId(data.userId)
        } else {
          console.error("Failed to load user ID:", data.error)
        }
      } catch (error) {
        console.error("Failed to load user ID:", error)
      }
    }

    loadUserId()
  }, [])

  const onSaveNotebook = async () => {
    if (!userId) {
      console.log("No user ID available")
      return
    }

    setIsSaving(true)
    try {
      // Use the updateNotebook server action for existing notebooks
      if (notebookId) {
        const { updateNotebook } = await import("@/app/actions/saveNotebook")
        const result = await updateNotebook(notebookId, {
          title: name,
          description,
          content,
        })

        if (result.success) {
          console.log("Notebook updated successfully")
        } else {
          console.log("Could not update the notebook:", result.error)
        }
      } else {
        // Create new notebook if no ID exists
        const response = await fetch("/api/notebook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            name,
            content,
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          console.log("Success on saving the notebook")
        } else {
          console.log("Could not save the notebook:", result.error)
        }
      }
    } catch (error) {
      console.error("Error saving notebook:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Save selection when textarea is focused
  const handleSelect = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      })
    }
  }

  // Update content and restore selection
  const updateContent = (newContent: string, newSelection?: { start: number; end: number }) => {
    setContent(newContent)

    // Use setTimeout to ensure the textarea has been updated
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = newSelection?.start ?? selection.start
        textareaRef.current.selectionEnd = newSelection?.end ?? selection.end
      }
    }, 0)
  }

  // Formatting functions
  const formatText = (formatType: string) => {
    if (!textareaRef.current) return

    const currentText = content
    const selStart = selection.start
    const selEnd = selection.end
    const selectedText = currentText.substring(selStart, selEnd)
    let newText = currentText
    let newSelection = { start: selStart, end: selEnd }

    switch (formatType) {
      case "h1":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "# ")
          newSelection = { start: selStart + 2, end: selEnd + 2 }
        } else {
          // Insert a new line with heading
          newText = currentText.substring(0, selStart) + "\n# " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 3, end: selEnd + 3 }
        }
        break
      case "h2":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "## ")
          newSelection = { start: selStart + 3, end: selEnd + 3 }
        } else {
          newText = currentText.substring(0, selStart) + "\n## " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 4, end: selEnd + 4 }
        }
        break
      case "h3":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "### ")
          newSelection = { start: selStart + 4, end: selEnd + 4 }
        } else {
          newText = currentText.substring(0, selStart) + "\n### " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 5, end: selEnd + 5 }
        }
        break
      case "bold":
        newText = currentText.substring(0, selStart) + "**" + selectedText + "**" + currentText.substring(selEnd)
        newSelection = {
          start: selStart + 2,
          end: selEnd + 2,
        }
        break
      case "italic":
        newText = currentText.substring(0, selStart) + "*" + selectedText + "*" + currentText.substring(selEnd)
        newSelection = {
          start: selStart + 1,
          end: selEnd + 1,
        }
        break
      case "code":
        newText = currentText.substring(0, selStart) + "`" + selectedText + "`" + currentText.substring(selEnd)
        newSelection = {
          start: selStart + 1,
          end: selEnd + 1,
        }
        break
      case "codeblock":
        newText = currentText.substring(0, selStart) + "```\n" + selectedText + "\n```" + currentText.substring(selEnd)
        newSelection = {
          start: selStart + 4,
          end: selEnd + 4,
        }
        break
      case "quote":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "> ")
          newSelection = { start: selStart + 2, end: selEnd + 2 }
        } else {
          newText = currentText.substring(0, selStart) + "\n> " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 3, end: selEnd + 3 }
        }
        break
      case "ul":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "- ")
          newSelection = { start: selStart + 2, end: selEnd + 2 }
        } else {
          newText = currentText.substring(0, selStart) + "\n- " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 3, end: selEnd + 3 }
        }
        break
      case "ol":
        if (isAtLineStart(currentText, selStart)) {
          newText = insertAtLineStart(currentText, selStart, "1. ")
          newSelection = { start: selStart + 3, end: selEnd + 3 }
        } else {
          newText = currentText.substring(0, selStart) + "\n1. " + selectedText + currentText.substring(selEnd)
          newSelection = { start: selStart + 4, end: selEnd + 4 }
        }
        break
      case "link":
        newText =
          currentText.substring(0, selStart) +
          "[" +
          (selectedText || "Link text") +
          "](url)" +
          currentText.substring(selEnd)
        newSelection = {
          start: selStart + selectedText.length + 3,
          end: selStart + selectedText.length + 6,
        }
        break
      case "image":
        newText =
          currentText.substring(0, selStart) +
          "![" +
          (selectedText || "Image alt text") +
          "](url)" +
          currentText.substring(selEnd)
        newSelection = {
          start: selStart + selectedText.length + 4,
          end: selStart + selectedText.length + 7,
        }
        break
    }

    updateContent(newText, newSelection)
  }

  // Helper functions
  const isAtLineStart = (text: string, position: number): boolean => {
    if (position === 0) return true
    return text.charAt(position - 1) === "\n"
  }

  const insertAtLineStart = (text: string, position: number, insertText: string): string => {
    // Find the start of the line
    let lineStart = position
    while (lineStart > 0 && text.charAt(lineStart - 1) !== "\n") {
      lineStart--
    }

    return text.substring(0, lineStart) + insertText + text.substring(lineStart)
  }

  // Slash command state
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 })

  // Check for slash commands
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/") {
      if (isAtLineStart(content, selection.start)) {
        // Show slash menu
        setShowSlashMenu(true)

        // Calculate position for slash menu
        if (textareaRef.current) {
          const { offsetLeft, offsetTop, selectionEnd, scrollTop } = textareaRef.current
          const textBeforeCursor = content.substring(0, selectionEnd)
          const lines = textBeforeCursor.split("\n")
          const lineHeight = 20 // Approximate line height
          const lineCount = lines.length

          setSlashPosition({
            x: offsetLeft + 20, // Add some padding
            y: offsetTop + lineCount * lineHeight - scrollTop,
          })
        }
      }
    } else if (showSlashMenu) {
      setShowSlashMenu(false)
    }
  }

  return (
    <div className={`${styles["notebook-editor"]} flex flex-col h-full relative`}>
      {/* Close button in the top-right corner */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 bg-gray-800/80 hover:bg-gray-700 text-gray-300"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Header */}
      <header className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-lg font-semibold sm:text-base">
          <Frame className="w-6 h-6" />
          <span>{name || "Untitled Notebook"}</span>
        </div>
        <div className="ml-4 text-sm">
          <Button className="bg-[#EEEEEE] text-black hover:text-white" onClick={onSaveNotebook} disabled={isSaving}>
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <Code className="h-4 w-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Formatting Toolbar (only visible in edit mode) */}
      {!isPreview && (
        <div className="flex items-center px-4 py-1 border-b border-gray-800 overflow-x-auto">
          <TooltipProvider>
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("h1")}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Heading 1</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("h2")}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Heading 2</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("h3")}
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Heading 3</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("bold")}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("italic")}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("code")}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Inline Code</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("ul")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("ol")}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Numbered List</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("quote")}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quote</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("link")}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Link</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("image")}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => formatText("codeblock")}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Code Block</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="ml-auto flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area - editable or preview */}
        <div className="flex-1 overflow-auto">
          {isPreview ? (
            <div className="prose prose-invert max-w-none p-6 markdown-preview">
              <ReactMarkdown
                components={{
                  // @ts-expect-error
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return !inline && match ? (
                      // @ts-expect-error
                      <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={cn("bg-gray-800 px-1 py-0.5 rounded text-sm", className)} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // Customize other elements as needed
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-6 mb-4 pb-1 border-b border-gray-700 text-gray-300 !important">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mt-5 mb-3 text-gray-300 !important">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold mt-4 mb-2 text-gray-300 !important">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-4 text-gray-300 !important">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-gray-300 !important">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-gray-300 !important">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 text-gray-300 !important">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4 text-gray-300 !important">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full relative">
              <textarea
                ref={textareaRef}
                className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono resize-none outline-none border-none p-6"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />

              {/* Slash Command Menu */}
              {showSlashMenu && (
                <div
                  className="absolute bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 w-64"
                  style={{
                    top: `${slashPosition.y}px`,
                    left: `${slashPosition.x}px`,
                  }}
                >
                  <div className="p-2 text-sm text-gray-400">Format</div>
                  <div
                    className="p-2 hover:bg-gray-800 cursor-pointer flex items-center"
                    onClick={() => {
                      formatText("h1")
                      setShowSlashMenu(false)
                    }}
                  >
                    <Heading1 className="h-4 w-4 mr-2" />
                    <span>Heading 1</span>
                  </div>
                  <div
                    className="p-2 hover:bg-gray-800 cursor-pointer flex items-center"
                    onClick={() => {
                      formatText("h2")
                      setShowSlashMenu(false)
                    }}
                  >
                    <Heading2 className="h-4 w-4 mr-2" />
                    <span>Heading 2</span>
                  </div>
                  <div
                    className="p-2 hover:bg-gray-800 cursor-pointer flex items-center"
                    onClick={() => {
                      formatText("ul")
                      setShowSlashMenu(false)
                    }}
                  >
                    <List className="h-4 w-4 mr-2" />
                    <span>Bullet List</span>
                  </div>
                  <div
                    className="p-2 hover:bg-gray-800 cursor-pointer flex items-center"
                    onClick={() => {
                      formatText("codeblock")
                      setShowSlashMenu(false)
                    }}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    <span>Code Block</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
