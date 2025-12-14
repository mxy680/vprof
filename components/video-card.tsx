"use client"

import Link from "next/link"
import { useState } from "react"

interface VideoCardProps {
  id: string
  title: string
  channel: string
  channelAvatar?: string
  thumbnail?: string
  duration?: string
  views?: number
  uploadedAt?: string
}

export function VideoCard({
  id,
  title,
  channel,
  channelAvatar,
  thumbnail,
  duration,
  views,
  uploadedAt,
}: VideoCardProps) {
  const [avatarError, setAvatarError] = useState(false)

  // Debug: Log avatar URL when component mounts
  if (channelAvatar && typeof window !== 'undefined') {
    console.log(`VideoCard ${id} - channelAvatar:`, channelAvatar)
  }

  return (
    <Link href={`/watch/${id}`} className="group">
      <div className="flex flex-col cursor-pointer">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-2">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
              <svg
                className="w-16 h-16 text-primary/30"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {duration && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-light px-1.5 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="flex gap-3">
          {/* Channel Avatar */}
          {channelAvatar && !avatarError ? (
            <img
              src={channelAvatar}
              alt={channel}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                console.error("Failed to load channel avatar:", {
                  url: channelAvatar,
                  naturalWidth: target.naturalWidth,
                  naturalHeight: target.naturalHeight,
                  complete: target.complete,
                  error: target.error,
                })
                setAvatarError(true)
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement
                console.log("Successfully loaded avatar:", {
                  url: channelAvatar,
                  naturalWidth: target.naturalWidth,
                  naturalHeight: target.naturalHeight,
                })
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-xs font-light">
                {channel[0]?.toUpperCase() || "A"}
              </span>
            </div>
          )}

          {/* Title and Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-normal text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {title}
            </h3>
            <p className="text-xs font-light text-muted-foreground">
              {channel}
            </p>
            {views !== undefined && uploadedAt && (
              <p className="text-xs font-light text-muted-foreground">
                {views.toLocaleString()} views • {uploadedAt}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

