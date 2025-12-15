"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface VideoPlayerProps {
  youtubeVideoId: string
  title: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function VideoPlayer({ youtubeVideoId, title }: VideoPlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const qKeyPressedRef = useRef(false)
  const [playerReady, setPlayerReady] = useState(false)

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer()
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer()
    }
  }, [])

  const initializePlayer = () => {
    if (!containerRef.current || playerRef.current) return

    try {
      const player = new window.YT.Player(containerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true)
            console.log("YouTube player ready")
          },
          onStateChange: (event: any) => {
            // Track pause state
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPaused(true)
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPaused(false)
            }
          },
        },
      })
      playerRef.current = player
    } catch (error) {
      console.error("Error initializing YouTube player:", error)
    }
  }

  const pauseVideo = useCallback(() => {
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.pauseVideo()
        setIsPaused(true)
        console.log("Video paused via Q key")
      } catch (error) {
        console.error("Error pausing video:", error)
      }
    } else {
      console.log("Player not ready yet")
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
        // Keep paused state - don't auto-resume
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
      <div ref={containerRef} className="w-full h-full" />
      {isPaused && qKeyPressedRef.current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/70 rounded-lg px-4 py-2 text-white text-sm font-light">
            Video paused (holding Q)
          </div>
        </div>
      )}
    </div>
  )
}

