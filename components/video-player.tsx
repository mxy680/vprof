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
  const [isFullscreen, setIsFullscreen] = useState(false)
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
            // Track player state if needed
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

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  const handleMicClick = () => {
    // TODO: Implement voice recognition
    console.log("Mic button clicked")
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
      <div
        ref={containerRef}
        id={`youtube-player-${youtubeVideoId}`}
        className="w-full h-full"
      />
      {/* Microphone button - only show in fullscreen */}
      {isFullscreen && (
        <button
          onClick={handleMicClick}
          className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors z-50 shadow-lg"
          aria-label="Voice input"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  )
}

