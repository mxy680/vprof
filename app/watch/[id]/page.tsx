import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
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

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default async function WatchPage({ params }: WatchPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { id } = await params

  // Fetch video from database
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
          subscriberCount: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!video) {
    notFound()
  }

  // Extract YouTube video ID
  const youtubeVideoId = video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null

  // Fetch recommended videos (other videos, excluding current)
  const recommendedVideos = await prisma.video.findMany({
    where: {
      status: "ready",
      id: {
        not: id,
      },
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  })

  // Format duration helper
  function formatDuration(seconds: number | null | undefined): string | undefined {
    if (!seconds) return undefined
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Format relative time helper
  function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2">
              {youtubeVideoId ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Video not available</p>
                </div>
              )}

              {/* Video Info */}
              <div className="space-y-3">
                <h1 className="text-xl font-normal text-foreground">{video.title}</h1>

                {/* Video Metadata */}
                <div className="flex items-center gap-4 text-sm font-light text-muted-foreground">
                  <span>{video.views.toLocaleString()} views</span>
                  <span>•</span>
                  <span>
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Channel Info and Subscribe */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    {video.channel.avatar ? (
                      <img
                        src={video.channel.avatar}
                        alt={video.channel.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-light">
                          {video.channel.name[0]?.toUpperCase() || "C"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-normal text-foreground">{video.channel.name}</p>
                      <p className="text-xs font-light text-muted-foreground">
                        {video.channel.subscriberCount.toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>
                  <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-light text-white hover:bg-red-700 transition-colors">
                    Subscribe
                  </button>
                </div>

                {/* Interaction Buttons */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                    </svg>
                    <span className="text-sm font-light text-foreground">Like</span>
                  </button>
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-sm font-light text-foreground">Share</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-sm font-light text-foreground">Save</span>
                  </button>
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <svg
                      className="w-5 h-5 text-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                {video.description && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-light text-foreground whitespace-pre-wrap line-clamp-3">
                      {video.description}
                    </div>
                    <button className="text-sm font-light text-foreground hover:text-primary transition-colors">
                      Show more
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-normal text-foreground">
                      {video.comments?.length || 0} Comments
                    </h2>
                    <button className="flex items-center gap-2 text-sm font-light text-foreground hover:text-primary transition-colors">
                      <span>Sort by</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-xs font-light">
                        {user.user_metadata?.name?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                    <div className="flex-1 border-b border-gray-200 pb-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="w-full bg-transparent text-sm font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Comments List - Placeholder for now */}
                  <div className="text-sm font-light text-muted-foreground">
                    Comments will be displayed here
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Recommended Videos */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {recommendedVideos.length > 0 ? (
                  recommendedVideos.map((recVideo) => {
                    const recYoutubeId = recVideo.youtubeUrl
                      ? extractYouTubeVideoId(recVideo.youtubeUrl)
                      : null
                    return (
                      <a
                        key={recVideo.id}
                        href={`/watch/${recVideo.id}`}
                        className="flex gap-3 group"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {recVideo.thumbnail ? (
                            <img
                              src={recVideo.thumbnail}
                              alt={recVideo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                              <svg
                                className="w-8 h-8 text-primary/30"
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
                          {recVideo.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-light px-1 py-0.5 rounded">
                              {formatDuration(recVideo.duration)}
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-sm font-normal text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {recVideo.title}
                          </h3>
                          <p className="text-xs font-light text-muted-foreground">
                            {recVideo.channel.name}
                          </p>
                          <p className="text-xs font-light text-muted-foreground">
                            {recVideo.views.toLocaleString()} views •{" "}
                            {formatRelativeTime(recVideo.createdAt)}
                          </p>
                        </div>
                      </a>
                    )
                  })
                ) : (
                  <div className="text-sm font-light text-muted-foreground text-center py-8">
                    No other videos available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

