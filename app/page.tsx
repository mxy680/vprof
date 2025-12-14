import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuthButton } from "@/components/auth-button"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Welcome!</h1>
            <p className="mt-2 text-muted-foreground">
              You are signed in as {user.email || user.user_metadata?.name || "User"}
            </p>
          </div>
          <AuthButton />
        </div>

        <div className="rounded-lg border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Your Dashboard</h2>
          <p className="mt-4 text-muted-foreground">
            This is your home page. You can add your content here.
          </p>
        </div>
      </div>
    </div>
  )
}

