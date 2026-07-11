import type { Listing, PriceUnit } from "./types";

export function formatPrice(price: number | null, unit: PriceUnit): string {
  if (unit === "quote" || price == null) return "Get a quote";
  const amount = `$${Number(price).toFixed(price % 1 === 0 ? 0 : 2)}`;
  return unit === "hourly" ? `${amount}/hr` : amount;
}

export function listingPriceLabel(listing: Pick<Listing, "price" | "price_unit">) {
  return formatPrice(listing.price, listing.price_unit);
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
