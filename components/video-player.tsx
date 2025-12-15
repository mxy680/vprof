"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface VideoPlayerProps {
  youtubeVideoId: string
  title: string
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string | HTMLElement, config: any) => any
      PlayerState: {
        UNSTARTED: number
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export function VideoPlayer({ youtubeVideoId, title }: VideoPlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const qKeyPressedRef = useRef(false)
  const [playerReady, setPlayerReady] = useState(false)
  const apiReadyRef = useRef(false)

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true
      // Small delay to ensure container is mounted
      setTimeout(() => initializePlayer(), 100)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval)
          apiReadyRef.current = true
          setTimeout(() => initializePlayer(), 100)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    // Load the script
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    tag.async = true
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true
      console.log("YouTube IFrame API ready")
      setTimeout(() => initializePlayer(), 100)
    }
  }, [])

  // Initialize player when container and API are ready
  const initializePlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current || !apiReadyRef.current) {
      console.log("Cannot initialize:", {
        hasContainer: !!containerRef.current,
        hasPlayer: !!playerRef.current,
        apiReady: apiReadyRef.current,
      })
      return
    }

    try {
      console.log("Initializing YouTube player with video ID:", youtubeVideoId)
      const player = new window.YT.Player(containerRef.current, {
        videoId: youtubeVideoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          enablejsapi: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true)
            console.log("YouTube player ready, can pause:", typeof event.target.pauseVideo === "function")
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPaused(true)
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPaused(false)
            }
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event.data)
          },
        },
      })
      playerRef.current = player
      console.log("Player instance created")
    } catch (error) {
      console.error("Error initializing YouTube player:", error)
    }
  }, [youtubeVideoId])

  // Re-initialize if video ID changes
  useEffect(() => {
    if (apiReadyRef.current && containerRef.current && !playerRef.current) {
      initializePlayer()
    }
  }, [youtubeVideoId, initializePlayer])

  const pauseVideo = useCallback(() => {
    if (!playerRef.current) {
      console.log("No player instance")
      return
    }
    if (!playerReady) {
      console.log("Player not ready yet")
      return
    }

    try {
      console.log("Attempting to pause video")
      playerRef.current.pauseVideo()
      setIsPaused(true)
      console.log("Pause command sent successfully")
    } catch (error) {
      console.error("Error pausing video:", error)
    }
  }, [playerReady])

  // Handle Q key press/release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      if (e.key.toLowerCase() === "q" && !qKeyPressedRef.current && !isInput) {
        e.preventDefault()
        e.stopPropagation()
        qKeyPressedRef.current = true
        pauseVideo()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q" && qKeyPressedRef.current) {
        qKeyPressedRef.current = false
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
    }
  }, [pauseVideo])

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
      <div
        ref={containerRef}
        id={`youtube-player-${youtubeVideoId}`}
        className="w-full h-full"
      />
      {isPaused && qKeyPressedRef.current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/70 rounded-lg px-4 py-2 text-white text-sm font-light">
            Video paused (holding Q)
          </div>
        </div>
      )}
      {/* Fullscreen button overlay */}
      <button
        onClick={() => {
          const container = containerRef.current?.parentElement
          if (container) {
            if (container.requestFullscreen) {
              container.requestFullscreen()
            } else if ((container as any).webkitRequestFullscreen) {
              ;(container as any).webkitRequestFullscreen()
            } else if ((container as any).mozRequestFullScreen) {
              ;(container as any).mozRequestFullScreen()
            } else if ((container as any).msRequestFullscreen) {
              ;(container as any).msRequestFullscreen()
            }
          }
        }}
        className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-colors z-20"
        aria-label="Fullscreen"
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
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
        </svg>
      </button>
    </div>
  )
}

