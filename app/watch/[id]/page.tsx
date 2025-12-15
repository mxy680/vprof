import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default async function WatchPage({ params }: WatchPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { id } = await params

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Video content will go here */}
      </main>
    </div>
  )
}

