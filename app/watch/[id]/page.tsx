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
              <div className="space-y-3">
                <h1 className="text-2xl font-normal text-foreground">{video.title}</h1>
                {video.description && (
                  <div className="text-sm font-light text-foreground whitespace-pre-wrap">
                    {video.description}
                  </div>
                )}
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

