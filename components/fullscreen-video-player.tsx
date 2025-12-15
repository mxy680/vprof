"use client"

import { useEffect, useRef, useState } from "react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { speakText, stopSpeaking } from "@/utils/text-to-speech"

interface FullscreenVideoPlayerProps {
  youtubeVideoId: string
  title: string
  videoId: string
}

export function FullscreenVideoPlayer({
  youtubeVideoId,
  title,
  videoId,
}: FullscreenVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [question, setQuestion] = useState<string>("")
  const qKeyPressedRef = useRef(false)

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Speech recognition handlers
  const handleSpeechResult = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return

    setIsProcessing(true)
    setQuestion(transcript)

    try {
      // Send question to AI API
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: transcript,
          videoId: videoId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      const answer = data.answer || "I couldn't generate a response."

      // Speak the answer
      speakText(answer)
    } catch (error) {
      console.error("Error processing question:", error)
      speakText("Sorry, I encountered an error processing your question.")
    } finally {
      setIsProcessing(false)
      setQuestion("")
    }
  }

  const handleSpeechError = (error: string) => {
    console.error("Speech recognition error:", error)
    if (error !== "no-speech") {
      speakText("Sorry, there was an error with speech recognition.")
    }
  }

  const { isListening, start, stop } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
  })

  // Handle Q key press for voice input
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only work in fullscreen
      if (!isFullscreen) return

      // Prevent default if Q is pressed
      if (e.key.toLowerCase() === "q" && !qKeyPressedRef.current) {
        qKeyPressedRef.current = true
        e.preventDefault()
        if (!isListening && !isProcessing) {
          start()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q" && qKeyPressedRef.current) {
        qKeyPressedRef.current = false
        if (isListening) {
          stop()
        }
      }
    }

    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isFullscreen, isListening, isProcessing, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      if (isListening) {
        stop()
      }
    }
  }, [isListening, stop])

  return (
    <div ref={containerRef} className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="w-full h-full"
      />
      {/* Visual indicator when listening */}
      {isListening && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-white text-center">
            <div className="w-20 h-20 border-4 border-white rounded-full animate-pulse mb-4 mx-auto"></div>
            <p className="text-lg font-light">Listening... (Hold Q to continue)</p>
            {question && (
              <p className="text-sm text-white/80 mt-2 max-w-md">{question}</p>
            )}
          </div>
        </div>
      )}
      {/* Processing indicator */}
      {isProcessing && !isListening && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-lg font-light">Processing your question...</p>
          </div>
        </div>
      )}
      {/* Fullscreen hint */}
      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
          Press F11 or click fullscreen, then hold Q to ask questions
        </div>
      )}
    </div>
  )
}

