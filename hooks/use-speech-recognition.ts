"use client"

import { useState, useRef, useEffect } from "react"

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
}

export function useSpeechRecognition({ onResult, onError }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef<string>("")

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      onError?.("Speech recognition not supported in this browser. Please use Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        // User stopped speaking, process the final transcript
        if (finalTranscriptRef.current.trim()) {
          onResult(finalTranscriptRef.current.trim())
          finalTranscriptRef.current = ""
        }
      } else {
        onError?.(event.error)
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // Process any remaining transcript
      if (finalTranscriptRef.current.trim()) {
        onResult(finalTranscriptRef.current.trim())
        finalTranscriptRef.current = ""
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [onResult, onError])

  const start = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        finalTranscriptRef.current = ""
      } catch (error) {
        // Recognition might already be starting
        console.error("Error starting recognition:", error)
      }
    }
  }

  const stop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, start, stop }
}

