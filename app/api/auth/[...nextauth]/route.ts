import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { config } from "@/auth"

// Enhanced config for API routes with Prisma adapter
const apiConfig = {
  ...config,
  adapter: PrismaAdapter(prisma),
}

const { handlers } = NextAuth(apiConfig)

export const { GET, POST } = handlers

