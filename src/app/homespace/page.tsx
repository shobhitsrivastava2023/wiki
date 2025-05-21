"use client"

import { useState } from "react"
import Homespace from "@/workspaces/Homespace"
import Notebook from "../../../packages/components/Notebook"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function HomePage() {
  const [showNotebook, setShowNotebook] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreateNotebook = (name: string, desc: string) => {
    setNotebookName(name)
    setDescription(desc)
    setShowNotebook(true)
  }

  return (
    <div className="h-screen w-full">
      {showNotebook ? (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={30}>
            <Notebook name={notebookName} description={description} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <Homespace onCreateNotebook={handleCreateNotebook} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Homespace onCreateNotebook={handleCreateNotebook} />
      )}
    </div>
  )
}
