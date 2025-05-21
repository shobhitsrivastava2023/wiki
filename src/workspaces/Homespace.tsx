"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchWikipediaData, type SearchResult } from "@/app/actions/fetchWikipedia"
import SearchBar from "../../packages/components/SearchBar"
const Homespace = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const title = searchParams.get("search") || ""
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(title)
 
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const parseTextWithLinks = (text: string) => {
    // Simple regex to find URLs in text
    const urlRegex = /(https?:\/\/[^\s]+)/g

    // Split the text by URLs
    const parts = text.split(urlRegex)

    // Find all URLs in the text
    const urls = text.match(urlRegex) || []

    // Combine parts and URLs
    return parts.map((part, i) => {
      // If this part is a URL (it matches with a URL we found)
      if (urls.includes(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {part}
          </a>
        )
      }
      // Otherwise, it's just text
      return part
    })
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
          {/* Article Section - 3/4 width */}
          <div className="md:col-span-3 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full overflow-y-auto">
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
                    <button className="inline-block px-4 py-2  bg-[#fff9cf] text-black  rounded-md hover:cursor-pointer  shadow-xl transition-colors">
                      Read Full Article
                    </button>
                  
                    
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="md:col-span-1 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full overflow-y-auto">
              <p className="text-xl text-gray-600">keep this blank</p>
            </div>
          </div>
        </div>

        {/* Related Topics Section */} 
        <div className="mt-6">
          <div className="bg-[#F9F9F9] p-6">
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
                      className="block text-blue-600"
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
