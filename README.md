This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project ([Create one here](https://supabase.com))

### Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key

3. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Configure Supabase Auth:**
   - In your Supabase dashboard, go to Authentication > Providers
   - Enable the providers you want (Email, Google, GitHub, etc.)
   - For OAuth providers, add your redirect URLs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

5. **Set up database (optional - if using Prisma):**
```bash
# If you want to use Prisma with Supabase
npx prisma migrate dev
npx prisma generate
```

6. **Start the development server:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Authentication

This project uses Supabase Auth for authentication. Features include:
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Session management with automatic token refresh
- Protected routes via middleware

**Auth Routes:**
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/auth/callback` - OAuth callback handler

### Project Structure

- `app/` - Next.js App Router pages and API routes
- `app/auth/` - Authentication pages (sign in, sign up)
- `lib/` - Utility functions
  - `lib/supabase/` - Supabase client configuration
  - `lib/auth.ts` - Server-side auth helpers
  - `lib/auth-client.ts` - Client-side auth hooks
- `middleware.ts` - Session refresh middleware
- `prisma/` - Database schema and migrations (optional)
- `components/` - React components

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
