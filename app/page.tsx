import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { VideoGrid } from "@/components/video-grid"
import { CategoryFilters } from "@/components/category-filters"
import { prisma } from "@/lib/prisma"

// Format duration in seconds to "MM:SS" or "HH:MM:SS"
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

// Format date to relative time string
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

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    })
    return categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

async function getVideos(categorySlug?: string | null) {
  try {
    const where: any = {
      status: "ready", // Only show ready videos
    }

    if (categorySlug && categorySlug !== "All") {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      })
      if (category) {
        where.categoryId = category.id
      }
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to 50 videos
    })

    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      channel: video.channel.name,
      channelAvatar: video.channel.avatar || undefined,
      thumbnail: video.thumbnail || undefined,
      duration: formatDuration(video.duration),
      views: video.views,
      uploadedAt: formatRelativeTime(video.createdAt),
    }))
  } catch (error) {
    console.error("Error fetching videos:", error)
    return []
  }
}

interface HomePageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const params = await searchParams
  const category = params.category || null
  const [categories, videos] = await Promise.all([
    getCategories(),
    getVideos(category),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {categories.length > 0 && <CategoryFilters categories={categories} />}
      <main className="flex-1">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-muted-foreground"
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
            <h3 className="text-lg font-normal text-foreground mb-2">No videos yet</h3>
            <p className="text-sm font-light text-muted-foreground text-center max-w-md">
              There are no videos to display. Start by adding your first video.
            </p>
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </main>
    </div>
  )
}

