"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="h-10 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-8 w-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {session.user.name || session.user.email}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/auth/signin"
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
    >
      Sign In
    </Link>
  )
}

