"use client"

import { useState, useCallback } from "react"
import DotMaps from "../../packages/components/dotmaps/dotmap"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DotMapsWorkspaceProps {
  onSelectArticle?: (title: string) => void
  onClose?: () => void
}

export default function DotMapsWorkspace({ onSelectArticle, onClose }: DotMapsWorkspaceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentMapId, setCurrentMapId] = useState("default")

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div className="relative h-full w-full">
      {/* Close button in the top-right corner */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 bg-white/80 hover:bg-white shadow-sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <DotMaps
        mapId={currentMapId}
        onSelectArticle={onSelectArticle}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  )
}
