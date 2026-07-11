import Link from "next/link";
import type { ListingWithJoins } from "@localserve/shared";
import { listingPriceLabel, timeAgo } from "@localserve/shared";

export function ListingCard({ listing }: { listing: ListingWithJoins }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <span className="text-4xl">{listing.category?.icon ?? "🔧"}</span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-medium">{listing.title}</h3>
          <span className="shrink-0 text-sm font-semibold text-emerald-600">
            {listingPriceLabel(listing)}
          </span>
        </div>
        <p className="truncate text-sm text-zinc-500">
          {listing.category?.name}
          {listing.city ? ` · ${listing.city}` : ""}
        </p>
        <p className="text-xs text-zinc-400">
          {listing.provider?.full_name} · {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  );
}
