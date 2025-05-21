"use client"
import { useState, useEffect } from "react"
import { TextAnimate } from "@/components/magicui/text-animate"

const HeroTextAnimations = () => {
  // Array of phrases to cycle through
  const phrases = [
    "Discover Wikipedia, Your Way.",
    "Explore Knowledge, Reimagined.",
    "Navigate Information, Effortlessly.",
    "Learn Anything, Anytime.",
    "Uncover Facts, Beautifully.",
  ]

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  // Handle the phrase rotation
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setIsAnimating(false)

      // Short timeout to allow exit animation to complete
      setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        setIsAnimating(true)
      }, 500)
    }, 5000) // Change phrase every 5 seconds

    return () => clearInterval(rotationInterval)
  }, [phrases.length])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-visible">
      {/* Background gradient effect */}
      <div className="absolute inset-0" />

      {/* Decorative elements with expanded size and positioning to "leak out" */}
      <div className="absolute -inset-24 opacity-10 overflow-visible">
        <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] rounded-full bg-blue-500 blur-[100px] animate-float-slow animate-pulse-subtle" />
        <div className="absolute bottom-1/3 right-1/4 w-[35vw] h-[35vw] rounded-full bg-purple-500 blur-[100px] animate-float-reverse animate-pulse-subtle-delayed" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Subtitle with fade-in animation */}
        

        {/* Animated text container with fixed height to prevent layout shift */}
        <div className="h-[180px] md:h-[240px] flex items-center justify-center">
          {isAnimating && (
            <TextAnimate
              key={currentPhraseIndex}
              animation="blurInUp"
              by="character"
              delay={0.5}
              once={false}
              className="text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-tight bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white"
            >
              {phrases[currentPhraseIndex]}
            </TextAnimate>
          )}
        </div>

        {/* Description with staggered animation */}
       
      </div>
    </div>
  )
}

export default HeroTextAnimations

