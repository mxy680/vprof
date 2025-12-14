"use client"

import { useAuth } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function AuthButton() {
  const auth = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth.getUser().then((user) => {
      setUser(user)
      setLoading(false)
    })
  }, [auth])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push("/auth/signin")
    router.refresh()
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground">
          {user.email || user.user_metadata?.name || "User"}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <a
        href="/auth/signin"
        className="text-sm text-foreground hover:text-primary"
      >
        Sign In
      </a>
      <a
        href="/auth/signup"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Sign Up
      </a>
    </div>
  )
}

