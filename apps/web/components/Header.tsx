"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabase } from "@/lib/supabase";

export function Header() {
  const { user, profile } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Local<span className="text-emerald-600">Serve</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/post" className="rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700">
            + Post a service
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">Messages</Link>
              <Link href="/bookings" className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">Bookings</Link>
              <Link href="/my-listings" className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">My listings</Link>
              <Link href="/profile" className="rounded-full px-3 py-1.5 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
                {profile?.full_name || "Profile"}
              </Link>
              <button
                onClick={async () => {
                  await getSupabase().auth.signOut();
                  router.push("/");
                }}
                className="rounded-full px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-1.5 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
