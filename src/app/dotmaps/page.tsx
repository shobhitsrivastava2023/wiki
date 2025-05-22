"use client"
import DotMapsContainer from "../../../packages/components/dotmaps/dot-maps-container"
import { useRouter } from "next/navigation"

export default function DotMapsPage() {
  const router = useRouter()

  const handleSelectArticle = (title: string) => {
    router.push(`/homespace?search=${encodeURIComponent(title)}`)
  }

  return (
    <div className="h-screen w-full">
      <DotMapsContainer onSelectArticle={handleSelectArticle} />
    </div>
  )
}
