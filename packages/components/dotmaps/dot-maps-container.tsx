"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Map, Maximize, Minimize } from "lucide-react"
import DotMaps from "./dotmap"

export default function DotMapsContainer({
  onSelectArticle,
  inPanel = false,
}: {
  onSelectArticle?: (title: string) => void
  inPanel?: boolean
}) {
  const [maps, setMaps] = useState<string[]>(() => {
    // Load saved maps from localStorage
    if (typeof window !== "undefined") {
      const savedMaps = localStorage.getItem("dotmaps-list")
      return savedMaps ? JSON.parse(savedMaps) : ["default"]
    }
    return ["default"]
  })

  const [activeMap, setActiveMap] = useState(maps[0])
  const [newMapName, setNewMapName] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Create a new map
  const createNewMap = useCallback(() => {
    if (!newMapName.trim()) return

    const updatedMaps = [...maps, newMapName]
    setMaps(updatedMaps)
    setActiveMap(newMapName)
    setNewMapName("")
    setCreateDialogOpen(false)

    // Save to localStorage
    localStorage.setItem("dotmaps-list", JSON.stringify(updatedMaps))
  }, [maps, newMapName])

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : "w-full h-full"}`}>
      <div className="flex flex-col h-full">
        {/* Header - only show when not in panel mode or in fullscreen */}
        {(!inPanel || isFullscreen) && (
          <div className="border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Map className="h-5 w-5" />
              DotMaps
            </h2>

            <div className="flex items-center gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    New Map
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Map</DialogTitle>
                    <DialogDescription>Give your new knowledge map a name.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="map-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="map-name"
                        value={newMapName}
                        onChange={(e) => setNewMapName(e.target.value)}
                        className="col-span-3"
                        placeholder="My Research Map"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNewMap}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" onClick={toggleFullscreen} className="flex items-center gap-1">
                {isFullscreen ? (
                  <>
                    <Minimize className="h-4 w-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    Fullscreen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Map selector tabs - only show when there are multiple maps */}
        {maps.length > 1 && (
          <Tabs value={activeMap} onValueChange={setActiveMap} className="w-full">
            <div className="border-b px-4">
              <TabsList className="h-10">
                {maps.map((map) => (
                  <TabsTrigger key={map} value={map} className="px-4">
                    {map}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}

        {/* Main content */}
        <div className="flex-grow">
          <DotMaps
            mapId={activeMap}
            onSelectArticle={onSelectArticle}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>
    </div>
  )
}
