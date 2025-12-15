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
              <div className="space-y-4">
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
                  <button className="rounded-full bg-background border border-gray-200 px-4 py-2 text-sm font-light text-foreground hover:bg-muted transition-colors">
                    Subscribe
                  </button>
                </div>

                {/* Interaction Buttons */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
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
                      <path d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span className="text-sm font-light text-foreground">Like</span>
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
                      <path d="M7 13l5 5m0 0l5-5m-5 5V6" />
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

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Channel info and other details can go here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

