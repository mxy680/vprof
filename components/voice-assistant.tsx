"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { PulseVoiceRecorder } from "@/components/ui/voice-recording"

interface VoiceAssistantProps {
  videoId: string
  videoTitle: string
}

export function VoiceAssistant({ videoId, videoTitle }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const mimeTypeRef = useRef<string>("audio/webm")

  const speakAnswer = useCallback((text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel() // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
      }

      synthRef.current.speak(utterance)
    }
  }, [])

  const processQuestion = useCallback(async (question: string): Promise<string> => {
    // TODO: Implement actual AI/question answering logic
    // For now, return a placeholder response
    return `Based on the video "${videoTitle}", I understand you asked: "${question}". This feature is currently being developed.`
  }, [videoTitle])

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to transcribe audio")
      }

      const data = await response.json()
      return data.transcript
    } catch (error: any) {
      console.error("Transcription error:", error)
      throw error
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      // Cleanup: stop recording and release microphone
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Determine the best MIME type for the browser
      let mimeType = "audio/webm"
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm"
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4"
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus"
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      })

      mimeTypeRef.current = mimeType
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        // Create audio blob with the same MIME type used for recording
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        })

        setIsRecording(false)
        setIsProcessing(true)

        try {
          // Transcribe audio using Whisper
          const transcript = await transcribeAudio(audioBlob)

          if (transcript.trim()) {
            // Process the question
            const answer = await processQuestion(transcript)
            speakAnswer(answer)
          } else {
            speakAnswer("I didn't hear anything. Please try again.")
          }
        } catch (error: any) {
          console.error("Error processing recording:", error)
          let errorMessage = "Sorry, I encountered an error processing your question."

          if (error.message?.includes("API key")) {
            errorMessage = "OpenAI API key is not configured. Please check your environment variables."
          } else if (error.message?.includes("transcribe")) {
            errorMessage = "Failed to transcribe audio. Please try again."
          }

          speakAnswer(errorMessage)
        } finally {
          setIsProcessing(false)
          audioChunksRef.current = []
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error("Error starting recording:", error)
      setIsRecording(false)

      let errorMessage = "Failed to access microphone."
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Microphone permission denied. Please allow microphone access."
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Microphone not found. Please check your microphone settings."
      }

      if (synthRef.current) {
        speakAnswer(errorMessage)
      }
    }
  }, [transcribeAudio, processQuestion, speakAnswer])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (isProcessing || isSpeaking) return

    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, isProcessing, isSpeaking, startRecording, stopRecording])

  // Check if browser supports MediaRecorder and SpeechSynthesis
  const isSupported =
    isMounted &&
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    window.speechSynthesis

  // During SSR and initial render, show a consistent UI
  if (!isMounted || !isSupported) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-light text-muted-foreground text-center">
          {!isMounted
            ? "Loading..."
            : "Voice assistant is not supported in your browser"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
      <div className="text-center">
        <h3 className="text-sm font-normal text-foreground">Ask a Question</h3>
      </div>

      <PulseVoiceRecorder
        recording={isRecording}
        onToggle={toggleRecording}
        disabled={isProcessing || isSpeaking}
        showDuration={false}
      />

      {isRecording && (
        <div className="flex items-center gap-2 text-sm font-light text-red-600">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span>Listening...</span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm font-light text-muted-foreground">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
          <span>Processing...</span>
        </div>
      )}

      {isSpeaking && (
        <div className="flex items-center gap-2 text-sm font-light text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Speaking...</span>
        </div>
      )}
    </div>
  )
}

