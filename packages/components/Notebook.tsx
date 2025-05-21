"use client"

import { useState } from "react"
import { Code, Eye, Frame } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface NotebookProps {
  name: string
  description: string
}

export default function Notebook({ name, description }: NotebookProps) {
  const [content, setContent] = useState(`# ${name || "Untitled Notebook"}

${description || "No description provided."}

## Notes

Start typing your notes here...

`)
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300">
      {/* Header */}
      <header className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-lg font-semibold sm:text-base">
          <Frame className="w-6 h-6" />
          <span>{name || "Untitled Notebook"}</span>
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

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area - editable or preview */}
        <div className="flex-1 overflow-auto">
          {isPreview ? (
            <div className="prose prose-invert max-w-none p-6 markdown-preview">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return !inline && match ? (
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
                    <h1 className="text-2xl font-bold mt-6 mb-4 pb-1 border-b border-gray-700">{children}</h1>
                  ),
                  h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4">{children}</blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full">
              <textarea
                className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono resize-none outline-none border-none p-6"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
