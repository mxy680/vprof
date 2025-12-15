"use client"

import { useAuth } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const auth = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    auth.getUser().then((user) => {
      if (user) {
        router.push("/")
      } else {
        setCheckingAuth(false)
      }
    })
  }, [auth, router])

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await auth.signInWithOAuth("google")
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/60">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/60 p-4 font-sans">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-8 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-normal tracking-tight text-gray-900">Get Started</h1>
          <p className="text-sm text-gray-600 font-light">
            Create your account with Google
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-light text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md tracking-wide"
          >
            {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing up...
            </span>
            ) : (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                  />
                </svg>
              Sign up with Google
            </span>
            )}
          </button>

        <p className="text-center text-xs text-gray-500">
            Already have an account?{" "}
          <a href="/auth/signin" className="text-primary font-medium hover:underline">
            Continue here
            </a>
          </p>
      </div>
    </div>
  )
}
