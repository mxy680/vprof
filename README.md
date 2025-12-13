This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Neon PostgreSQL database (or any PostgreSQL database)

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

### Project Structure

- `app/` - Next.js App Router pages and API routes
- `lib/` - Utility functions (Prisma client)
- `prisma/` - Database schema and migrations
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
