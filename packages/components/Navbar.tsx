"use client"

import { useState, useEffect } from "react"
import { SignInDialog, SignUpDialog } from "./authDialog"

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <>
      <header className="fixed top-0 left-1/2 -translate-x-1/2 z-50 shadow-lg w-[85vw] rounded-full p-2 content-center">
        <div
          className={`mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8 rounded-full bg-white ${
            isScrolled ? "shadow-md" : ""
          } transition-shadow duration-300`}
        >
          <div className="flex items-center justify-between h-10 ">
            <div className="flex-shrink-0">
              <a href="/" className="text-xl font-bold">
                WikiArch.
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="/"
                  className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </a>
                <a
                  href="/about"
                  className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  About
                </a>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors duration-300"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sign In Dialog */}
      {isSignInOpen && <SignInDialog onClose={() => setIsSignInOpen(false)} setIsSignUpOpen={setIsSignUpOpen} />}

      {/* Sign Up Dialog */}
      {isSignUpOpen && <SignUpDialog onClose={() => setIsSignUpOpen(false)} setIsSignInOpen={setIsSignInOpen} />}
    </>
  )
}

export default Navbar