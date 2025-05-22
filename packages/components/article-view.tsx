"use client"

import { useEffect, useState, useRef } from "react"
import { fetchWikipediaData, type SearchResult } from "@/app/actions/fetchWikipedia"
import { ChevronLeft, Bookmark, Share2, Type, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import LoadingSpinner from "./LoadingSpinner"
import { initReadingProgress } from "./reading-progress"

// Add this after the imports
import "./article-view.css"

interface ArticleViewProps {
  title: string
  onBack: () => void
}

export default function ArticleView({ title, onBack }: ArticleViewProps) {
  const router = useRouter()
  const [article, setArticle] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState("normal") // small, normal, large
  const [showScrollTop, setShowScrollTop] = useState(false)

  const articleCache = useRef<Record<string, SearchResult>>({})
  const contentRef = useRef<HTMLDivElement>(null)

  const onSearch = (query: string) => {
    router.push(`/homespace?search=${query}`)
  }

  useEffect(() => {
    const fetchArticle = async () => {
      if (!title) return

      try {
        setLoading(true)

        // Check if we have the article in cache
        if (articleCache.current[title]) {
          setArticle(articleCache.current[title])
          setLoading(false)
          return
        }

        const data = await fetchWikipediaData(title)
        // Store in cache
        articleCache.current[title] = data
        setArticle(data)
      } catch (error) {
        console.error("Error fetching article:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [title])

  // Initialize reading progress indicator
  useEffect(() => {
    if (!loading && article) {
      // Defer reading progress initialization slightly to ensure DOM is ready
      // This is particularly important for calculations based on scroll height
      const timeoutId = setTimeout(() => {
        const cleanup = initReadingProgress()
        return cleanup
      }, 100); // Small delay
      return () => clearTimeout(timeoutId);
    }
  }, [loading, article]);


  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle font size changes
  const changeFontSize = (size: string) => {
    setFontSize(size)
    if (contentRef.current) {
      contentRef.current.classList.remove("text-small", "text-normal", "text-large")
      contentRef.current.classList.add(`text-${size}`)
    }
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    // REMOVED: h-full w-full overflow-auto from this div.
    // The body/html should handle the main scrolling now.
    <div className="bg-[#F5F5F5] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Navigation - Updated with sticky positioning */}
        {/* Added a solid background for better visibility when sticky */}
        <div className="sticky top-0 z-50 bg-[#F5F5F5] py-4 mb-8 flex justify-between items-center border-b border-gray-200">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Summary
          </Button>

          <div className="flex gap-2">
            <div className="flex items-center bg-white rounded-md shadow-sm border border-gray-200 mr-2">
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${fontSize === "small" ? "bg-gray-100" : ""}`}
                onClick={() => changeFontSize("small")}
              >
                <Type className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${fontSize === "normal" ? "bg-gray-100" : ""}`}
                onClick={() => changeFontSize("normal")}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${fontSize === "large" ? "bg-gray-100" : ""}`}
                onClick={() => changeFontSize("large")}
              >
                <Type className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {/* Main Content - Full Width */}
        {/* REMOVED: min-h-[400px] from this div. It's usually not necessary for scrolling context here */}
        <div>
          {/* Article Section - Full Width */}
          {/* REMOVED: h-full and overflow-y-auto from this div. */}
          <div className="h-full">
            <div className="bg-white p-8 rounded-lg shadow-sm article-container">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="large" message="Loading article..." />
                </div>
              ) : !article ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-xl text-gray-600">Article not found</p>
                </div>
              ) : (
                <div className="h-full">
                  <h1 className="article-title">{article.title}</h1>

                  {/* Add article metadata here if you wish (e.g., last modified, reading time) */}
                  {article.lastModified && (
                    <p className="text-sm text-gray-500 mb-4">
                      Last modified: {new Date(article.lastModified).toLocaleDateString()}
                      {article.readingTime && ` • ${article.readingTime} min read`}
                    </p>
                  )}
                 


                  {article.articleContent ? (
                    <div
                      ref={contentRef}
                      className={`article-content text-${fontSize} prose prose-slate max-w-none`}
                      dangerouslySetInnerHTML={{ __html: article.articleContent }}
                    />
                  ) : (
                    <p className="article-summary">{article.summary}</p>
                  )}

                  {/* Related Articles Section */}
                  {article.relatedArticles && article.relatedArticles.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <h2 className="text-2xl font-bold mb-6 text-gray-800">Related Articles</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {article.relatedArticles.map((related) => (
                          <div
                            key={related.url}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onSearch(related.title)} // Re-use onSearch to navigate
                          >
                            {related.thumbnail && (
                              <img
                                src={related.thumbnail}
                                alt={related.title}
                                className="w-full h-32 object-cover rounded-md mb-3"
                              />
                            )}
                            <h3 className="text-lg font-semibold text-blue-700 hover:underline mb-1">
                              {related.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {related.summary || "No summary available."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories Section */}
                  {article.categories && article.categories.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
                      <div className="flex flex-wrap gap-2">
                        {article.categories.map((category) => (
                          <span
                            key={category}
                            className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => onSearch(`Category:${category}`)} // You might want a specific handler for categories
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-8 right-8 rounded-full shadow-md z-50"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}