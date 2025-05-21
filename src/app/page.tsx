"use client"
import SearchBar from "../../packages/components/SearchBar"
import HeroTextAnimations from "../../packages/components/AnimatedComponents/HeroTextAnimations"
import Navbar from "../../packages/components/Navbar"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar component */}
      <Navbar />

      {/* Hero section taking majority of the viewport height */}
      <div className="h-[40vh] pt-24  w-full flex items-center justify-center">
        <HeroTextAnimations />
      </div>

      {/* Search bar section positioned below the hero */}
      <div className="w-full py-8 px-4 flex justify-center">
        <SearchBar  />
      </div>
    </main>
  )
}
