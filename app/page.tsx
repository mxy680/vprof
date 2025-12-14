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
        <VideoGrid videos={videos} />
      </main>
    </div>
  )
}

