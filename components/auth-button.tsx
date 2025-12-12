"use client"

import { signOut, useSession } from "@/lib/auth-client"
import Link from "next/link"
import { useEffect } from "react"

export function AuthButton() {
  const { data: session, isPending } = useSession()
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/0f661d19-0f97-4614-82fe-e84f3a13638c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'components/auth-button.tsx:useSession',
        message: 'useSession hook state (Better Auth)',
        data: {
          hypothesisId: 'D',
          isPending,
          hasSession: !!session,
          sessionUser: session?.user ? { email: session.user.email, name: session.user.name } : null
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'post-fix'
      })
    }).catch(() => {});
  }, [session, isPending]);
  // #endregion

  if (isPending) {
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
          onClick={() => signOut()}
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

