import { NextRequest, NextResponse } from "next/server"

/**
 * Extracts YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*&v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Validates a YouTube URL by checking if the video exists and is embeddable
 * Uses YouTube's oEmbed API which returns 404 if video doesn't exist or isn't embeddable
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL format" },
        { status: 400 }
      )
    }

    // Validate video exists and is embeddable using YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    
    try {
      const response = await fetch(oembedUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { 
              error: "Video not found or embedding is disabled",
              valid: false 
            },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { 
            error: "Failed to validate video",
            valid: false 
          },
          { status: response.status }
        )
      }

      const data = await response.json()

      return NextResponse.json({
        valid: true,
        videoId,
        title: data.title,
        thumbnail: data.thumbnail_url,
        author: data.author_name,
      })
    } catch (fetchError) {
      console.error("Error validating YouTube URL:", fetchError)
      return NextResponse.json(
        { 
          error: "Failed to validate video. Please try again.",
          valid: false 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in validate-youtube route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

