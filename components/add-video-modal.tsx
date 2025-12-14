"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AddVideoModalProps {
  children: React.ReactNode
}

export function AddVideoModal({ children }: AddVideoModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const validateYouTubeUrl = async (url: string): Promise<boolean> => {
    setIsValidating(true)
    setValidationError(null)

    try {
      const response = await fetch("/api/videos/validate-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        setValidationError(data.error || "Video not found or cannot be embedded")
        return false
      }

      setValidationError(null)
      return true
    } catch (err) {
      setValidationError("Failed to validate video. Please try again.")
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationError(null)
    setIsLoading(true)

    try {
      if (youtubeUrl) {
        // Validate YouTube URL format first
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
        if (!youtubeRegex.test(youtubeUrl)) {
          setError("Please enter a valid YouTube URL")
          setIsLoading(false)
          return
        }

        // Validate that video exists and is embeddable
        const isValid = await validateYouTubeUrl(youtubeUrl)
        if (!isValid) {
          setIsLoading(false)
          return
        }

        // Create video in database
        const response = await fetch("/api/videos/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ youtubeUrl }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to add video")
          setIsLoading(false)
          return
        }

        // Success - refresh the page to show the new video
        window.location.reload()
      } else if (selectedFile) {
        // Create video record for file upload
        const response = await fetch("/api/videos/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to upload video")
          setIsLoading(false)
          return
        }

        // Success - refresh the page
        window.location.reload()
      } else {
        setError("Please provide either a YouTube URL or upload a file")
        setIsLoading(false)
        return
      }

      // Reset and close
      setYoutubeUrl("")
      setSelectedFile(null)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file")
        return
      }
      setSelectedFile(file)
      setYoutubeUrl("") // Clear YouTube URL when file is selected
      setError(null)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value)
    if (e.target.value) {
      setSelectedFile(null) // Clear file when URL is entered
      setError(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="rounded-lg border border-gray-200 bg-background">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
            <h2 className="text-xl font-normal text-foreground">New Video</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {(error || validationError) && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-light">
                {error || validationError}
              </div>
            )}

            {/* YouTube URL Section */}
            <div className="space-y-1.5">
              <label
                htmlFor="youtube-url"
                className="block text-sm font-light text-foreground"
              >
                YouTube URL
              </label>
              <div className="relative">
                <input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={handleUrlChange}
                  onBlur={async () => {
                    if (youtubeUrl && !selectedFile) {
                      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
                      if (youtubeRegex.test(youtubeUrl)) {
                        await validateYouTubeUrl(youtubeUrl)
                      }
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-gray-200 bg-background px-4 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      className="w-4 h-4 animate-spin text-muted-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground font-light">OR</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-1.5">
              <label
                htmlFor="file-upload"
                className="block text-sm font-light text-foreground"
              >
                Upload File
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="flex-1 rounded-lg border border-gray-200 bg-background px-4 py-2 text-sm font-light text-foreground file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-light file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
                />
                {selectedFile && (
                  <span className="text-xs font-light text-muted-foreground whitespace-nowrap">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-gray-200 bg-background px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (!youtubeUrl && !selectedFile)}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-light text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
