"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingWithJoins } from "@localserve/shared";
import { fetchMyListings, listingPriceLabel } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function MyListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithJoins[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/my-listings");
    if (user) {
      fetchMyListings(getSupabase(), user.id)
        .then(setListings)
        .finally(() => setReady(true));
    }
  }, [loading, user, router]);

  async function setStatus(id: string, status: "active" | "paused" | "deleted") {
    await getSupabase().from("listings").update({ status }).eq("id", id);
    setListings((ls) =>
      status === "deleted"
        ? ls.filter((l) => l.id !== id)
        : ls.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Link
          href="/post"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + New listing
        </Link>
      </div>
      {ready && listings.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          You haven&apos;t posted any services yet.
        </p>
      )}
      {listings.map((l) => (
        <div
          key={l.id}
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {l.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photos[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">{l.category?.icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/listing/${l.id}`} className="truncate font-medium hover:underline">
              {l.title}
            </Link>
            <p className="text-sm text-zinc-500">
              {listingPriceLabel(l)} ·{" "}
              <span className={l.status === "active" ? "text-emerald-600" : "text-amber-600"}>
                {l.status}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2 text-sm">
            <button
              onClick={() => setStatus(l.id, l.status === "active" ? "paused" : "active")}
              className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {l.status === "active" ? "Pause" : "Activate"}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this listing?")) setStatus(l.id, "deleted");
              }}
              className="rounded-full border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
