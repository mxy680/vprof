import { auth } from "@/auth"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function getCurrentUserId() {
  const session = await auth()
  return session?.user?.id
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}

