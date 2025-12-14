"use client"

import { createClient } from "@/lib/supabase/client"

export function useAuth() {
  const supabase = createClient()

  return {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    },
    signUp: async (email: string, password: string, options?: { name?: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.name ? { name: options.name } : undefined,
        },
      })
      return { data, error }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },
    signInWithOAuth: async (provider: "google" | "github") => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { data, error }
    },
    getUser: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    },
    getSession: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session
    },
  }
}

