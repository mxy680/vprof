// Original component inspired by voice input concept
// Created with unique pulse animation and recording visualization

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface PulseVoiceRecorderProps {
  recording?: boolean
  onToggle?: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
  duration?: number
  disabled?: boolean
  showDuration?: boolean
}

export const PulseVoiceRecorder = ({
  recording = false,
  onToggle,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  duration: externalDuration,
  disabled = false,
  showDuration = true,
}: PulseVoiceRecorderProps) => {
  const [internalRecording, setInternalRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [pulseIntensity, setPulseIntensity] = useState<number[]>([])

  // Use external recording state if provided, otherwise use internal
  const isRecording = recording !== undefined ? recording : internalRecording

  useEffect(() => {
    if (!isRecording) {
      setDuration(0)
      setPulseIntensity([])
      return
    }

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1)
      // Generate random pulse patterns for visual feedback
      setPulseIntensity(Array.from({ length: 5 }, () => Math.random()))
    }, 1000)

    return () => clearInterval(timer)
  }, [isRecording])

  // Sync with external duration if provided
  useEffect(() => {
    if (externalDuration !== undefined) {
      setDuration(externalDuration)
    }
  }, [externalDuration])

  const handleToggle = () => {
    if (disabled) return

    if (onToggle) {
      onToggle()
    } else {
      if (internalRecording) {
        setInternalRecording(false)
        setDuration(0)
        setPulseIntensity([])
      } else {
        setInternalRecording(true)
      }
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Animated pulse rings */}
        {isRecording && (
          <>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 rounded-full border-2 border-red-400/30",
                  "animate-ping"
                )}
                style={{
                  animationDelay: `${index * 0.3}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </>
        )}

        {/* Main record button */}
        <button
          onClick={onToggle ? handleToggle : undefined}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          disabled={disabled}
          className={cn(
            "relative z-10 w-24 h-24 rounded-full transition-all duration-300",
            "flex items-center justify-center",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 scale-110"
              : disabled
                ? "bg-muted cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50"
          )}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded-sm" />
          ) : (
            <div className="w-6 h-6 bg-white rounded-full" />
          )}
        </button>
      </div>

      {/* Duration display */}
      {isRecording && showDuration && (
        <div className="text-2xl font-mono font-bold text-gray-700">
          {formatTime(duration)}
        </div>
      )}
    </div>
  )
}

