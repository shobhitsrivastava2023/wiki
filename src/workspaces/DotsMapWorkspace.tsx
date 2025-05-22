"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import DotMapsContainer from "../../packages/components/dotmaps/dot-maps-container"

interface DotMapsWorkspaceProps {
  onSelectArticle?: (title: string) => void
}

// Update the DotMapsWorkspace to support the inPanel mode
export default function DotMapsWorkspace({
  onSelectArticle,
  inPanel = true,
}: DotMapsWorkspaceProps & { inPanel?: boolean }) {
  const router = useRouter()

  const handleSelectArticle = useCallback(
    (title: string) => {
      if (onSelectArticle) {
        onSelectArticle(title)
      } else {
        router.push(`/homespace?search=${encodeURIComponent(title)}`)
      }
    },
    [onSelectArticle, router],
  )

  return <DotMapsContainer onSelectArticle={handleSelectArticle} inPanel={inPanel} />
}
