"use client"

import { useAuth } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { AddVideoModal } from "./add-video-modal"

export function Navbar() {
  const auth = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    auth.getUser().then((user) => {
      setUser(user)
      setLoading(false)
    })
  }, [auth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push("/auth/signin")
    router.refresh()
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log("Search:", searchQuery)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Left Section: Hamburger Menu + Logo */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <button
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6 text-foreground"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <a
            href="/"
            className="flex items-center gap-2 text-xl font-normal tracking-tight text-foreground hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span>PhewTube</span>
          </a>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="flex flex-1 items-center border border-gray-200 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos"
                className="flex-1 px-4 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none text-sm font-light"
              />
              <button
                type="submit"
                className="px-6 py-2 border-l border-gray-200 bg-muted/50 hover:bg-muted transition-colors"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5 text-foreground"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              className="ml-2 p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Voice search"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right Section: Actions + User */}
        <div className="flex items-center gap-2 min-w-[200px] justify-end">
          {loading ? (
            <div className="text-sm font-light text-muted-foreground">Loading...</div>
          ) : user ? (
            <>
              <AddVideoModal>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-background hover:bg-muted transition-colors text-sm font-light text-foreground"
                  aria-label="Add video"
                >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Video</span>
                </button>
              </AddVideoModal>
              <button
                className="p-2 rounded-full hover:bg-muted transition-colors relative"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-light text-sm hover:bg-primary/90 transition-colors"
                  aria-label="User menu"
                >
                  {user.user_metadata?.name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase() ||
                    "U"}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-background shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-normal text-foreground">
                        {user.user_metadata?.name || "User"}
                      </p>
                      <p className="text-xs font-light text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <a
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </a>
                    <a
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help
                    </a>
                    <a
                      href="/feedback"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Send Feedback
                    </a>
                    <div className="border-t border-gray-200 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/auth/signin"
                className="text-sm font-light text-foreground hover:text-primary transition-colors"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-light text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

