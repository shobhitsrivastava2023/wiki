"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, X, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

const TRENDING_SEARCHES = [
  "Climate change",
  "Artificial intelligence",
  "Olympic Games 2024",
  "Quantum computing",
  "Space exploration",
]

const SearchBar = ({
  onSearch,
  placeholder = "Search Wiki...",
  className = "",
}: SearchBarProps) => {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showTrending, setShowTrending] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)


  const onSearchClick = () => { 
    
  }

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query)
      setShowTrending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowTrending(false)
    }
  }

  const handleTrendingItemClick = (item: string) => {
    setQuery(item)
    if (onSearch) {
      onSearch(item)
    }
    setShowTrending(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowTrending(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="flex flex-col items-center w-full relative">
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-2 w-full max-w-md transition-all duration-200",
          isFocused && "sm:scale-[1.01]",
          className,
        )}
      >
        <div className="relative flex-1 group" ref={inputContainerRef}>
          <div
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200",
              isFocused && "text-primary",
            )}
          >
            <Search className="h-4 w-4" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              setShowTrending(true)
            }}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-10 pr-10 w-full border-muted-foreground/20 transition-all duration-200",
              isFocused && "border-primary/50 ring-1 ring-primary/20",
            )}
            aria-label="Search input"
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown inside input container */}
          {showTrending && (
            <div
              ref={dropdownRef}
              className={cn(
                "absolute left-0 right-0 mt-2 bg-[#fefae0] rounded-md shadow-lg border border-[#e6ddb5] z-50 overflow-hidden transition-all duration-300",
                showTrending
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-[-10px] pointer-events-none",
              )}
              style={{
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                transitionDuration: "400ms",
              }}
            >
              <div className="p-3 border-b border-[#e6ddb5]">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <TrendingUp className="h-4 w-4 text-black/70" />
                  <span>Trending on Wikipedia</span>
                </div>
              </div>
              <ul className="py-1">
                {TRENDING_SEARCHES.map((item, index) => (
                  <li key={index}>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f8f4d5] transition-colors duration-150 flex items-center gap-2 text-black/80"
                      onClick={() => handleTrendingItemClick(item)}
                    >
                      <Search className="h-3.5 w-3.5 text-black/60" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-[#e6ddb5] bg-[#f8f4d5]/50">
                <p className="text-xs text-black/60 text-center">
                  Based on today's trending Wikipedia articles
                </p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleSearch}
          className="gap-2 bg-[#fefae0] hover:bg-[#f8f4d5] text-black shadow-sm transition-all duration-200 hover:shadow"
          aria-label="Search button"
        >
          <Search className="h-4 w-4" />
          <span className="sm:inline hidden">Search</span>
        </Button>
      </div>

      {!showTrending && (
        <div>
          <p className="text-sm text-muted-foreground mt-2">
            Search for any topic in the wiki. Press Enter to search.
          </p>
        </div>
      )}
    </div>
  )
}

export default SearchBar
