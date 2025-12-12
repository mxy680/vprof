This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Neon PostgreSQL database (or any PostgreSQL database)
3. OAuth app credentials (optional, for Google/GitHub login)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth - Generate a secret with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

3. **Run database migrations:**
```bash
npx prisma migrate dev
```

4. **Generate Prisma Client:**
```bash
npx prisma generate
```

5. **Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Authentication Setup

This project uses NextAuth.js (Auth.js) v5 for authentication with support for:
- **Google OAuth** - Set up at [Google Cloud Console](https://console.cloud.google.com/)
- **GitHub OAuth** - Set up at [GitHub Developer Settings](https://github.com/settings/developers)

#### Setting up Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### Setting up GitHub OAuth:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

### Project Structure

- `app/` - Next.js App Router pages and API routes
- `app/api/auth/` - NextAuth.js authentication routes
- `auth.ts` - NextAuth.js configuration
- `lib/` - Utility functions (Prisma client, auth helpers)
- `prisma/` - Database schema and migrations
- `components/` - React components
- `middleware.ts` - Route protection middleware

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
