import { notFound } from "next/navigation";
import { fetchListing, listingPriceLabel, timeAgo } from "@localserve/shared";
import { getServerSupabase } from "@/lib/supabase-server";
import { ListingActions } from "@/components/ListingActions";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await fetchListing(getServerSupabase(), id);
  if (!listing || listing.status === "deleted") notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-7xl">{listing.category?.icon ?? "🔧"}</span>
          )}
        </div>
        {listing.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {listing.photos.slice(1).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={p} alt="" className="h-24 w-32 rounded-lg object-cover" />
            ))}
          </div>
        )}
        <div>
          <h2 className="mb-2 text-lg font-semibold">About this service</h2>
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {listing.description || "No description provided."}
          </p>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            {listing.category?.icon} {listing.category?.name}
            {listing.city ? ` · ${listing.city}` : ""}
          </p>
          <h1 className="mt-1 text-xl font-bold">{listing.title}</h1>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {listingPriceLabel(listing)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Posted {timeAgo(listing.created_at)} · serves within {listing.service_radius_km} km
          </p>
          <ListingActions listing={listing} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Provider</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-950">
              {(listing.provider?.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{listing.provider?.full_name || "Provider"}</p>
              {listing.provider?.city && (
                <p className="text-sm text-zinc-500">{listing.provider.city}</p>
              )}
            </div>
          </div>
          {listing.provider?.bio && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{listing.provider.bio}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
