"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conversation } from "@localserve/shared";
import { fetchConversations, timeAgo } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/messages");
    if (user) {
      fetchConversations(getSupabase(), user.id)
        .then(setConversations)
        .finally(() => setReady(true));
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-2xl font-bold">Messages</h1>
      {ready && conversations.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          No conversations yet. Message a provider from any listing.
        </p>
      )}
      {conversations.map((c) => {
        const other = c.customer_id === user.id ? c.provider : c.customer;
        return (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-950">
              {(other?.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{other?.full_name || "User"}</p>
              <p className="truncate text-sm text-zinc-500">{c.listing?.title}</p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{timeAgo(c.created_at)}</span>
          </Link>
        );
      })}
    </div>
  );
}
