import { AuthButton } from "@/components/auth-button";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            Video Profiler
          </h1>
          <AuthButton />
        </div>
        
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {user ? `Welcome back, ${user.name || user.email}!` : "Welcome to Video Profiler"}
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {user 
              ? "Upload a video to get started with AI-powered video interaction."
              : "Sign in to upload videos and interact with them using AI voice commands."}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {user ? (
            <a
              href="/upload"
              className="flex h-12 w-full items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 md:w-[158px]"
            >
              Upload Video
            </a>
          ) : (
            <a
              href="/auth/signin"
              className="flex h-12 w-full items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 md:w-[158px]"
            >
              Get Started
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
