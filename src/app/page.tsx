"use client"
import SearchBar from "../../packages/components/SearchBar"
import HeroTextAnimations from "../../packages/components/AnimatedComponents/HeroTextAnimations"
import Navbar from "../../packages/components/Navbar"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const onSearch = (query: string) => { 
    router.push(`/homespace?search=${query}`)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar component */}
      <Navbar />

     
      <div className="h-[40vh] pt-24  w-full flex items-center justify-center">
        <HeroTextAnimations />
      </div>

      {/* Search bar section positioned below the hero */}
      <div className="w-full py-8 px-4 flex justify-center">
        <SearchBar onSearch= {onSearch}
        
          />
      </div>
    </main>
  )
}
