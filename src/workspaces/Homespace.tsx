"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchWikipediaData, type SearchResult } from "@/app/actions/fetchWikipedia"
import SearchBar from "../../packages/components/SearchBar"
import { Book, Bookmark, Map, PlusCircle, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const Homespace = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const title = searchParams.get("search") || ""
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating notebook:", { notebookName, description })
    setNotebookName("")
    setDescription("")
    setOpen(false)
  }

  const onSearch = (query: string) => {
    router.push(`/homespace?search=${query}`)
  }

  useEffect(() => {
    if (!title) return
    setLoading(true)
    const getData = async () => {
      const data = await fetchWikipediaData(title)
      setSearchResult(data)
      setLoading(false)
    }
    getData()
  }, [title])

  const parseTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    const urls = text.match(urlRegex) || []
    return parts.map((part, i) =>
      // @ts-expect-error
      urls.includes(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {part}
        </a>
      ) : (
        part
      )
    )
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[400px]">
          {/* Article Section */}
          <div className="md:col-span-3 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full overflow-y-auto rounded-lg shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Loading...</p>
                </div>
              ) : !searchResult ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-xl text-gray-600">Article over here</p>
                </div>
              ) : (
                <div className="h-full">
                  <h1 className="text-2xl font-bold mb-4">{searchResult.title}</h1>
                  {searchResult.mediaUrl && (
                    <div className="float-right ml-6 mb-4">
                      <img
                        src={searchResult.mediaUrl || "/placeholder.svg"}
                        alt={searchResult.title}
                        className="w-48 h-auto rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                  <p className="text-gray-700">{parseTextWithLinks(searchResult.summary)}</p>
                  <div className="mt-4">
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(searchResult.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#fff9cf] text-black rounded-md hover:cursor-pointer hover:bg-[#ffef9e] shadow-sm transition-colors"
                    >
                      Read Full Article
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full overflow-y-auto rounded-lg shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                  <Search className="w-4 h-4 mr-2 text-gray-600" />
                  Research On It
                </h2>
                <div className="border-b border-gray-200 mb-4"></div>
              </div>

              {/* Notebooks */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 cursor-pointer">
                      <h3 className="text-md font-medium text-gray-700 flex items-center">
                        <Book className="w-4 h-4 mr-2 text-gray-600" />
                        Your Notebooks
                      </h3>
                      <PlusCircle className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                    </div>
                  </div>
                </DialogTrigger>

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

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
                  <button className="text-gray-500 hover:text-gray-700">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bookmarks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-700 flex items-center">
                    <Bookmark className="w-4 h-4 mr-2 text-gray-600" />
                    Bookmarks
                  </h3>
                  <button className="text-gray-500 hover:text-gray-700">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>


          
        </div>
        <div className="mt-6">
          <div className="bg-[#F9F9F9] p-6 rounded-lg shadow-sm">
            {!searchResult || searchResult.relatedArticles.length === 0 ? (
              <p className="text-xl text-gray-600">related topics here</p>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Related Topics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResult.relatedArticles.map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homespace
