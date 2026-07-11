import { Suspense } from "react";
import { fetchCategories, fetchListings } from "@localserve/shared";
import { getServerSupabase } from "@/lib/supabase-server";
import { BrowseControls } from "@/components/BrowseControls";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const db = getServerSupabase();
  const [categories, listings] = await Promise.all([
    fetchCategories(db),
    fetchListings(db, {
      categoryId: params.category ? Number(params.category) : undefined,
      query: params.q,
      lat: params.lat ? Number(params.lat) : undefined,
      lng: params.lng ? Number(params.lng) : undefined,
      radiusKm: params.radius ? Number(params.radius) : undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Local services near you
        </h1>
        <p className="text-zinc-500">
          Detailing, handyman, mobile mechanic and more — from people in your area.
        </p>
      </div>
      <Suspense>
        <BrowseControls categories={categories} />
      </Suspense>
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          No services found. Try a different search — or be the first to{" "}
          <a href="/post" className="text-emerald-600 underline">
            post one
          </a>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
