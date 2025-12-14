import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

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
 * Gets or creates a Profile for the user
 */
async function getOrCreateProfile(userId: string, email?: string) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
  })

  if (!profile) {
    // Create profile with a default username based on email
    let username = email?.split("@")[0] || `user_${userId.slice(0, 8)}`
    
    // Ensure username is unique
    let counter = 1
    while (await prisma.profile.findUnique({ where: { username } })) {
      username = `${email?.split("@")[0] || `user_${userId.slice(0, 8)}`}_${counter}`
      counter++
    }

    profile = await prisma.profile.create({
      data: {
        userId,
        username,
      },
    })
  }

  return profile
}

/**
 * Extracts channel ID or username from YouTube channel URL
 * Returns the identifier and whether it's a channel ID (starts with UC) or username
 */
function extractChannelId(url: string): { id: string; isChannelId: boolean } | null {
  // Match patterns like:
  // /channel/UC... (channel ID)
  // /c/channelname (custom URL, could be username or channel ID)
  // /user/username (username)
  // /@channelname (handle/username)
  
  // Channel ID pattern (starts with UC)
  const channelIdMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/)
  if (channelIdMatch && channelIdMatch[1]) {
    return { id: channelIdMatch[1], isChannelId: true }
  }

  // Custom URL /c/ - could be either
  const customMatch = url.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/)
  if (customMatch && customMatch[1]) {
    // If it starts with UC, it's a channel ID, otherwise it's a username
    const isChannelId = customMatch[1].startsWith("UC")
    return { id: customMatch[1], isChannelId }
  }

  // User pattern (username)
  const userMatch = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/)
  if (userMatch && userMatch[1]) {
    return { id: userMatch[1], isChannelId: false }
  }

  // Handle pattern @channelname (username)
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/)
  if (handleMatch && handleMatch[1]) {
    return { id: handleMatch[1], isChannelId: false }
  }

  return null
}

/**
 * Gets channel ID from video ID using YouTube Data API
 */
async function getChannelIdFromVideo(videoId: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.log("YOUTUBE_API_KEY not set, skipping channel ID fetch")
    return null
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    console.log("Making API request to get channel ID from video:", url.replace(apiKey, "API_KEY_HIDDEN"))
    
    const response = await fetch(url)
    console.log("Video API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch video details:", response.status, errorText)
      return null
    }

    const data = await response.json()
    console.log("Video API response items:", data.items?.length || 0)
    
    if (data.items && data.items.length > 0) {
      const channelId = data.items[0].snippet?.channelId
      console.log("Extracted channel ID from video:", channelId)
      return channelId || null
    }

    return null
  } catch (error: any) {
    console.error("Error getting channel ID from video:", error.message || error)
    return null
  }
}

/**
 * Fetches channel avatar using YouTube Data API v3
 */
async function fetchYouTubeChannelAvatar(authorUrl: string, videoId?: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  console.log("YOUTUBE_API_KEY check:", apiKey ? `Set (length: ${apiKey.length})` : "NOT SET")
  
  if (!apiKey) {
    console.log("YOUTUBE_API_KEY not set, cannot fetch channel avatar via API")
    return null
  }

  try {
    let channelId: string | null = null

    // BEST APPROACH: If we have a video ID, get channel ID directly from the video
    // This is the most reliable method
    if (videoId) {
      console.log("Getting channel ID from video ID (most reliable method):", videoId)
      channelId = await getChannelIdFromVideo(videoId)
      if (channelId) {
        console.log("Successfully got channel ID from video:", channelId)
      }
    }

    // FALLBACK: Try to extract channel ID from author URL if video method didn't work
    if (!channelId) {
      const extracted = extractChannelId(authorUrl)
      if (extracted) {
        if (extracted.isChannelId && extracted.id.startsWith("UC")) {
          // It's already a channel ID
          channelId = extracted.id
          console.log("Using channel ID from URL:", channelId)
        } else {
          // It's a username/handle - try to resolve it
          console.log("Attempting to resolve username/handle to channel ID:", extracted.id)
          
          // Try the newer forHandle parameter (if available in your API version)
          let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${extracted.id}&key=${apiKey}`
          let response = await fetch(url)
          
          if (response.ok) {
            const data = await response.json()
            if (data.items && data.items.length > 0) {
              channelId = data.items[0].id
              console.log("Resolved handle using forHandle:", channelId)
            }
          }
          
          // If forHandle didn't work, try forUsername (deprecated but sometimes works)
          if (!channelId) {
            url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${extracted.id}&key=${apiKey}`
            response = await fetch(url)
            
            if (response.ok) {
              const data = await response.json()
              if (data.items && data.items.length > 0) {
                channelId = data.items[0].id
                console.log("Resolved username using forUsername:", channelId)
              }
            }
          }
          
          // Last resort: search API
          if (!channelId) {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@${extracted.id}&type=channel&maxResults=1&key=${apiKey}`
            response = await fetch(url)
            
            if (response.ok) {
              const data = await response.json()
              if (data.items && data.items.length > 0) {
                channelId = data.items[0].id.channelId
                console.log("Resolved handle using search API:", channelId)
              }
            }
          }
        }
      }
    }

    if (!channelId) {
      console.log("Could not determine channel ID from video or URL")
      return null
    }

    // Validate that we have a proper channel ID (starts with UC) before making API call
    if (!channelId.startsWith("UC")) {
      console.log("Invalid channel ID format (doesn't start with UC):", channelId)
      console.log("This appears to be a handle/username, not a channel ID. Attempting to resolve...")
      
      // Try to resolve it using search API as last resort
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@${channelId}&type=channel&maxResults=1&key=${apiKey}`
      const searchResponse = await fetch(searchUrl)
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.items && searchData.items.length > 0) {
          const resolvedChannelId = searchData.items[0].id.channelId
          console.log("Resolved handle to channel ID via search:", resolvedChannelId)
          channelId = resolvedChannelId
        } else {
          console.log("Could not resolve handle to channel ID")
          return null
        }
      } else {
        console.log("Search API failed:", searchResponse.status)
        return null
      }
    }

    console.log("Fetching channel avatar for channel ID:", channelId)

    // Use YouTube Data API v3 to get channel thumbnails
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
    console.log("API URL:", url.replace(apiKey, "API_KEY_HIDDEN"))
    
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch channel details:", response.status, errorText)
      
      // Check for quota/rate limit errors
      if (response.status === 403) {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
          console.error("YouTube API quota exceeded")
        } else if (errorData.error?.errors?.[0]?.reason === "dailyLimitExceeded") {
          console.error("YouTube API daily limit exceeded")
        }
      }
      
      return null
    }

    const data = await response.json()
    console.log("API response items count:", data.items?.length || 0)

    if (data.items && data.items.length > 0) {
      const thumbnails = data.items[0].snippet?.thumbnails
      if (thumbnails) {
        // Prefer high quality, fallback to medium, then default
        const avatarUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url
        if (avatarUrl) {
          console.log("Found channel avatar:", avatarUrl)
          return avatarUrl
        } else {
          console.log("No thumbnails found in snippet")
        }
      } else {
        console.log("No snippet.thumbnails in response")
      }
    } else {
      console.log("No items in API response - channel might not exist or ID is invalid")
    }

    console.log("No avatar found in API response")
    return null
  } catch (error: any) {
    console.error("Error fetching channel avatar via API:", error.message || error)
    return null
  }
}

/**
 * Fetches channel avatar from YouTube channel URL (fallback method - scraping)
 */
async function fetchYouTubeChannelAvatarFallback(authorUrl: string): Promise<string | null> {
  try {
    console.log("Attempting to fetch avatar from:", authorUrl)
    
    // Try to extract channel ID and use YouTube's about page
    const extracted = extractChannelId(authorUrl)
    if (!extracted) {
      return null
    }
    
    const channelId = extracted.id
    const isChannelId = extracted.isChannelId
    console.log("Extracted channel ID:", channelId, "isChannelId:", isChannelId)
    
    if (channelId && isChannelId && channelId.startsWith("UC")) {
      // It's a channel ID, try the about page
      const aboutUrl = `https://www.youtube.com/channel/${channelId}/about`
      console.log("Trying about page:", aboutUrl)
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(aboutUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://www.youtube.com/",
          },
        })

        clearTimeout(timeoutId)
        
        console.log("About page response status:", response.status)
        
        if (response.ok) {
          const html = await response.text()
          console.log("HTML length:", html.length)
          
          // Try og:image meta tag
          const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
          if (ogImageMatch && ogImageMatch[1] && !ogImageMatch[1].includes("default")) {
            console.log("Found avatar via og:image:", ogImageMatch[1])
            return ogImageMatch[1]
          }

          // Try to find avatar URL pattern in HTML (multiple patterns)
          const patterns = [
            /https:\/\/yt3\.(ggpht\.com|googleusercontent\.com)\/[^"'\s<>]+=s\d+-c-k-c0x00ffffff-no-rj/i,
            /"avatar":\s*{\s*"thumbnails":\s*\[\s*{\s*"url":\s*"([^"]+)"/i,
            /"channelAvatar":\s*{\s*"thumbnails":\s*\[\s*{\s*"url":\s*"([^"]+)"/i,
          ]
          
          for (const pattern of patterns) {
            const match = html.match(pattern)
            if (match && match[0] && !match[0].includes("default")) {
              const url = match[1] || match[0]
              console.log("Found avatar via pattern:", url)
              return url
            }
          }
          
          console.log("No avatar found in about page HTML")
        } else {
          console.log("About page fetch failed with status:", response.status)
        }
      } catch (error: any) {
        console.error("Error fetching about page:", error.message || error)
      }
    }

    // Fallback: Try the original author URL
    console.log("Trying fallback: original author URL")
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(authorUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Referer": "https://www.youtube.com/",
        },
      })

      clearTimeout(timeoutId)
      
      console.log("Author URL response status:", response.status)
      
      if (response.ok) {
        const html = await response.text()
        
        // Try og:image
        const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
        if (ogImageMatch && ogImageMatch[1] && !ogImageMatch[1].includes("default")) {
          console.log("Found avatar via og:image (fallback):", ogImageMatch[1])
          return ogImageMatch[1]
        }

        // Try avatar URL pattern
        const avatarPattern = /https:\/\/yt3\.(ggpht\.com|googleusercontent\.com)\/[^"'\s<>]+=s\d+-c-k-c0x00ffffff-no-rj/i
        const avatarMatch = html.match(avatarPattern)
        if (avatarMatch && avatarMatch[0]) {
          console.log("Found avatar via pattern (fallback):", avatarMatch[0])
          return avatarMatch[0]
        }
      }
    } catch (error: any) {
      console.error("Error fetching author URL:", error.message || error)
    }

    console.log("Avatar fetch failed - returning null")
    return null
  } catch (error: any) {
    console.error("Error fetching channel avatar:", error.message || error)
    return null
  }
}

/**
 * Gets or creates a Channel based on YouTube channel name
 */
async function getOrCreateYouTubeChannel(channelName: string, authorUrl?: string, avatar?: string | null) {
  // Create a handle from the channel name (sanitize and make URL-friendly)
  const sanitized = channelName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50)
  
  let handle = `@${sanitized}`
  
  // Try to find existing channel by name first
  let channel = await prisma.channel.findFirst({
    where: { name: channelName },
  })

  if (!channel) {
    // Ensure handle is unique
    let counter = 1
    let uniqueHandle = handle
    while (await prisma.channel.findUnique({ where: { handle: uniqueHandle } })) {
      uniqueHandle = `@${sanitized}_${counter}`
      counter++
    }

    channel = await prisma.channel.create({
      data: {
        name: channelName,
        handle: uniqueHandle,
        avatar: avatar || null,
        profileId: null, // YouTube channels don't belong to a user profile
      },
    })
  } else if (!channel.avatar && avatar) {
    // Update existing channel with avatar if it doesn't have one
    channel = await prisma.channel.update({
      where: { id: channel.id },
      data: { avatar },
    })
  }

  return channel
}

/**
 * Gets or creates a default Channel for the profile (for file uploads)
 */
async function getOrCreateDefaultChannel(profileId: string, profileUsername: string) {
  // Try to find an existing channel for this profile
  let channel = await prisma.channel.findFirst({
    where: { profileId },
  })

  if (!channel) {
    // Create a default channel with unique handle
    let handle = `@${profileUsername}`
    let counter = 1
    
    // Ensure handle is unique
    while (await prisma.channel.findUnique({ where: { handle } })) {
      handle = `@${profileUsername}_${counter}`
      counter++
    }

    channel = await prisma.channel.create({
      data: {
        name: `${profileUsername}'s Channel`,
        handle,
        profileId,
      },
    })
  }

  return channel
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { youtubeUrl, fileName, fileSize } = body

    if (!youtubeUrl && !fileName) {
      return NextResponse.json(
        { error: "Either YouTube URL or file is required" },
        { status: 400 }
      )
    }

    if (youtubeUrl) {
      // Validate YouTube URL and get metadata
      const videoId = extractYouTubeVideoId(youtubeUrl)
      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL format" },
          { status: 400 }
        )
      }

      // Get video metadata from YouTube oEmbed API
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
      const oembedResponse = await fetch(oembedUrl)

      if (!oembedResponse.ok) {
        return NextResponse.json(
          { error: "Video not found or embedding is disabled" },
          { status: 404 }
        )
      }

      const oembedData = await oembedResponse.json()

      // Get or create channel based on YouTube channel name
      const channelName = oembedData.author_name || "Unknown Channel"
      const authorUrl = oembedData.author_url
      
      // Try to fetch channel avatar using YouTube Data API
      let channelAvatar: string | null = null
      if (authorUrl) {
        console.log("Fetching avatar for channel URL:", authorUrl)
        console.log("Video ID available:", videoId || "NOT AVAILABLE")
        
        if (!videoId) {
          console.log("WARNING: No video ID available - avatar fetching may fail")
        }
        
        channelAvatar = await fetchYouTubeChannelAvatar(authorUrl, videoId)
        
        // If API method failed and we have a fallback, try it
        if (!channelAvatar && !process.env.YOUTUBE_API_KEY) {
          console.log("API key not set, trying fallback method")
          channelAvatar = await fetchYouTubeChannelAvatarFallback(authorUrl)
        }
        
        console.log("Avatar result:", channelAvatar ? "Found" : "Not found")
      } else {
        console.log("No author_url in oEmbed data")
      }
      
      const channel = await getOrCreateYouTubeChannel(channelName, authorUrl, channelAvatar)

      // Create video record
      const video = await prisma.video.create({
        data: {
          title: oembedData.title || "Untitled Video",
          description: null,
          thumbnail: oembedData.thumbnail_url || null,
          youtubeUrl: youtubeUrl,
          duration: null, // Can be fetched later if needed
          views: 0,
          status: "ready", // YouTube videos are ready immediately
          channelId: channel.id,
        },
      })

      return NextResponse.json({
        success: true,
        video: {
          id: video.id,
          title: video.title,
        },
      })
    } else {
      // Handle file upload - use user's channel
      const profile = await getOrCreateProfile(user.id, user.email)
      const channel = await getOrCreateDefaultChannel(profile.id, profile.username || "user")

      // For now, we'll just create a video record with "processing" status
      // File upload handling can be implemented later
      const video = await prisma.video.create({
        data: {
          title: fileName || "Untitled Video",
          description: null,
          thumbnail: null,
          youtubeUrl: null,
          duration: null,
          views: 0,
          status: "processing", // File uploads need processing
          channelId: channel.id,
        },
      })

      return NextResponse.json({
        success: true,
        video: {
          id: video.id,
          title: video.title,
        },
        message: "File upload will be processed. Video ID saved.",
      })
    }
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    )
  }
}

