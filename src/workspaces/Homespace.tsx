"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchWikipediaData, type SearchResult } from "@/app/actions/fetchWikipedia"
import SearchBar from "../../packages/components/SearchBar"
import { Book, Bookmark, Map, PlusCircle, Search, Clock, Share2, ExternalLink, BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// Update the HomespaceProps interface to include the onToggleDotMaps prop
interface HomespaceProps {
  onCreateNotebook?: (name: string, description: string) => void
  onViewFullArticle?: (title: string) => void
  onBookmarkArticle?: (article: SearchResult) => void
  onToggleDotMaps?: () => void
}

// Update the Homespace component to use the onToggleDotMaps prop
const Homespace = ({ onCreateNotebook, onViewFullArticle, onBookmarkArticle, onToggleDotMaps }: HomespaceProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const title = searchParams.get("search") || ""
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const MAX_MAIN_SUMMARY_LENGTH = 200 // Declare MAX_MAIN_SUMMARY_LENGTH

  // Dialog states
  const [notebookDialogOpen, setNotebookDialogOpen] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const [description, setDescription] = useState("")
  const [showDotMapsDialog, setShowDotMapsDialog] = useState(false)

  // Extract and save search history to local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory")
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Update search history when a new search is made
  useEffect(() => {
    if (title && !searchHistory.includes(title)) {
      const updatedHistory = [title, ...searchHistory].slice(0, 5)
      setSearchHistory(updatedHistory)
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))
    }
  }, [title, searchHistory])

  // Fetch Wikipedia data when title changes
  useEffect(() => {
    if (!title) return

    const controller = new AbortController()
    const signal = controller.signal

    const getData = async () => {
      setLoading(true)
      try {
        const data = await fetchWikipediaData(title)
        if (!signal.aborted) {
          setSearchResult(data)
        }
      } catch (error) {
        console.error("Error fetching Wikipedia data:", error)
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    getData()

    return () => {
      controller.abort()
    }
  }, [title])

  // Handle search action
  const onSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return
      router.push(`/homespace?search=${encodeURIComponent(query)}`)
    },
    [router],
  )

  // Handle notebook creation
  const handleSubmitNotebook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notebookName.trim()) return

    if (onCreateNotebook) {
      onCreateNotebook(notebookName, description)
    }

    setNotebookName("")
    setDescription("")
    setNotebookDialogOpen(false)
  }

  // Update the handleOpenDotMaps function to use the onToggleDotMaps prop if available
  const handleOpenDotMaps = useCallback(() => {
    if (onToggleDotMaps) {
      onToggleDotMaps()
    } else {
      router.push("/dotmaps")
    }
  }, [onToggleDotMaps, router])

  // Render text with links
  const parseTextWithLinks = useCallback((text: string) => {
    if (!text) return ""

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    const urls = text.match(urlRegex) || []

    return parts.map((part, i) =>
      urls.includes(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {part}
        </a>
      ) : (
        part
      ),
    )
  }, [])

  // Handle full article view
  const handleReadFullArticle = useCallback(() => {
    if (searchResult && onViewFullArticle) {
      setLoading(true)
      // Use setTimeout to allow the loading state to render before transitioning
      setTimeout(() => {
        onViewFullArticle(searchResult.title)
        setLoading(false)
      }, 100)
    }
  }, [searchResult, onViewFullArticle])

  // Handle bookmarking
  const handleBookmark = useCallback(() => {
    if (searchResult && onBookmarkArticle) {
      onBookmarkArticle(searchResult)
    }
  }, [searchResult, onBookmarkArticle])

  // Format article reading time
  const formattedReadingTime = useMemo(() => {
    if (!searchResult?.readingTime) return "< 1 min read"
    return `${searchResult.readingTime} min read`
  }, [searchResult?.readingTime])

  // Truncate main summary
  const truncatedSummary = useMemo(() => {
    if (!searchResult?.summary) return ""
    if (searchResult.summary.length > MAX_MAIN_SUMMARY_LENGTH) {
      return searchResult.summary.substring(0, MAX_MAIN_SUMMARY_LENGTH) + "..."
    }
    return searchResult.summary
  }, [searchResult?.summary])

  // Add to DotMap dialog
  const handleAddToDotMap = useCallback(() => {
    if (!searchResult) return

    // Get existing maps
    const savedMaps = localStorage.getItem("dotmaps-list")
    const maps = savedMaps ? JSON.parse(savedMaps) : ["default"]

    // Add the current article to the default map
    const mapId = "default"
    const savedMap = localStorage.getItem(`dotmap-${mapId}`)
    const mapData = savedMap ? JSON.parse(savedMap) : { nodes: [], edges: [] }

    // Create a new node for this article
    const newNode = {
      id: `node-${Date.now()}`,
      type: "custom",
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        title: searchResult.title,
        content: searchResult.summary?.substring(0, 100) + "...",
        type: "article",
      },
    }

    // Add the node to the map
    mapData.nodes.push(newNode)

    // Save the updated map
    localStorage.setItem(`dotmap-${mapId}`, JSON.stringify(mapData))

    // Show confirmation
    setShowDotMapsDialog(true)
  }, [searchResult])

  // Render article content
  const renderArticleContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex space-x-4">
            <Skeleton className="h-40 w-40 flex-shrink-0" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )
    }

    if (!searchResult) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">Search for a topic to start exploring</p>
          <p className="text-sm text-gray-400 mt-2">
            Try searching for topics like "Quantum Physics" or "Ancient Rome"
          </p>
        </div>
      )
    }

    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{searchResult.title}</h1>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleBookmark} className="hover:bg-yellow-100">
                    <Bookmark className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark this article</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleAddToDotMap} className="hover:bg-green-100">
                    <Map className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to DotMap</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(searchResult.url, "_blank")}
                    className="hover:bg-blue-100"
                  >
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on Wikipedia</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-green-100">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share this article</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {searchResult.categories && searchResult.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchResult.categories.map((category, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                onClick={() => onSearch(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center text-xs text-gray-500 mb-4 space-x-4">
          {searchResult.lastModified && (
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Updated: {new Date(searchResult.lastModified).toLocaleDateString()}
            </span>
          )}
          {searchResult.readingTime !== undefined && (
            <span className="flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              {formattedReadingTime}
            </span>
          )}
        </div>

        <div className="article-content ">
          {searchResult.mediaUrl && (
            <div className="float-right ml-6 mb-4">
              <figure className="max-w-xs">
                <img
                  src={searchResult.mediaUrl || "/placeholder.svg"}
                  alt={searchResult.title}
                  className="w-full max-h-60 rounded-md border border-gray-200 shadow-sm"
                />
                {searchResult.mediaCaption && (
                  <figcaption className="text-xs text-gray-500 mt-1 text-center">
                    {searchResult.mediaCaption}
                  </figcaption>
                )}
              </figure>
            </div>
          )}

          <div className="text-gray-600 leading-relaxed ">{parseTextWithLinks(truncatedSummary)}</div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleReadFullArticle}
              className="px-4 py-2 bg-[#fff9cf] text-black hover:bg-[#ffef9e] shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2">Loading...</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Full Article
                </>
              )}
            </Button>

            <Button onClick={handleAddToDotMap} variant="outline" className="px-4 py-2 shadow-sm transition-colors">
              <Map className="mr-2 h-4 w-4" />
              Add to DotMap
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render related topics section
  const renderRelatedTopics = () => {
    if (!searchResult || searchResult.relatedArticles.length === 0) {
      return (
        <div className="text-center text-gray-500 py-6">
          <p>Related topics will appear here when available</p>
        </div>
      )
    }

    return (
      <>
        <h2 className="text-xl font-bold mb-4">Related Topics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {searchResult.relatedArticles.map((article, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">
                  <button
                    onClick={() => onSearch(article.title)}
                    className="text-left text-indigo-600 hover:text-indigo-800 hover:underline w-full"
                  >
                    {article.title}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-3">{article.summary}</p>
              </CardContent>
              {article.thumbnail && (
                <div className="px-6 pb-4">
                  <img
                    src={article.thumbnail || "/placeholder.svg"}
                    alt={article.title}
                    className="w-full h-24 object-cover rounded-md"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#EEEEEE] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
          {/* Article Section */}
          <div className="md:col-span-3 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full rounded-lg shadow-sm">{renderArticleContent()}</div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full rounded-lg shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                  <Search className="w-4 h-4 mr-2 text-gray-600" />
                  Research On It
                </h2>
                <div className="border-b border-gray-200 mb-4"></div>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-600" />
                      Recent Searches
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {searchHistory.map((item, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => onSearch(item)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline text-left w-full truncate"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-b border-gray-200 my-4"></div>
                </div>
              )}

              {/* Notebooks */}
              <Dialog open={notebookDialogOpen} onOpenChange={setNotebookDialogOpen}>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-700 flex items-center">
                      <Book className="w-4 h-4 mr-2 text-gray-600" />
                      Your Notebooks
                    </h3>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <PlusCircle className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </DialogTrigger>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Create notebooks to organize your research</p>
                </div>

                <DialogContent className="sm:max-w-[425px] p-6">
                  <DialogHeader className="text-center mb-4">
                    <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
                      <Book className="h-6 w-6" />
                      Create a new Notebook
                    </DialogTitle>
                    <DialogDescription className="text-center mt-2">
                      Fill in the details below to create your new notebook.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmitNotebook} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notebook-name">Notebook Name</Label>
                      <Input
                        id="notebook-name"
                        placeholder="My Research Notes"
                        value={notebookName}
                        onChange={(e) => setNotebookName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Notes for my research project..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <DialogFooter className="mt-4">
                      <Button type="button" variant="outline" onClick={() => setNotebookDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Notebook</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* DotMaps */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-700 flex items-center">
                    <Map className="w-4 h-4 mr-2 text-gray-600" />
                    DotMaps
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddToDotMap}>
                    <PlusCircle className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Visual maps of connected knowledge</p>
                <Button variant="default" size="sm" className="w-full mt-2" onClick={handleOpenDotMaps}>
                  <Map className="mr-2 h-4 w-4" />
                  {onToggleDotMaps ? "Show DotMaps Panel" : "Open DotMaps"}
                </Button>
                <div className="border-b border-gray-200 my-4"></div>
              </div>

              {/* Bookmarks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-700 flex items-center">
                    <Bookmark className="w-4 h-4 mr-2 text-gray-600" />
                    Bookmarks
                  </h3>
                  <button className="text-gray-500 hover:text-gray-700" onClick={handleBookmark}>
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Save articles for later reference</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Topics Section */}
        <div className="mt-6">
          <div className="bg-[#F9F9F9] p-6 rounded-lg shadow-sm">{renderRelatedTopics()}</div>
        </div>
      </div>

      {/* Add to DotMap Dialog */}
      <Dialog open={showDotMapsDialog} onOpenChange={setShowDotMapsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Added to DotMap</DialogTitle>
            <DialogDescription>The article has been added to your DotMap.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDotMapsDialog(false)}>
              Close
            </Button>
            <Button onClick={handleOpenDotMaps}>
              <Map className="mr-2 h-4 w-4" />
              Open DotMap
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Homespace
