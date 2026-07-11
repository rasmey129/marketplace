import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookingRequest,
  Category,
  Conversation,
  Listing,
  ListingWithJoins,
  Message,
  Profile,
} from "./types";

const LISTING_SELECT =
  "*, provider:profiles(*), category:categories(*)";

export async function fetchCategories(db: SupabaseClient): Promise<Category[]> {
  const { data, error } = await db.from("categories").select("*").order("id");
  if (error) throw error;
  return data as Category[];
}

export interface BrowseFilters {
  categoryId?: number;
  query?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export async function fetchListings(
  db: SupabaseClient,
  filters: BrowseFilters = {}
): Promise<ListingWithJoins[]> {
  // Use geo RPC when a location is set, otherwise a plain filtered query.
  if (filters.lat != null && filters.lng != null) {
    const { data, error } = await db.rpc("listings_nearby", {
      p_lat: filters.lat,
      p_lng: filters.lng,
      p_radius_km: filters.radiusKm ?? 40,
      p_category: filters.categoryId ?? null,
      p_query: filters.query || null,
    });
    if (error) throw error;
    return hydrateListings(db, data as Listing[]);
  }

  let q = db
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.query)
    q = q.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as ListingWithJoins[];
}

async function hydrateListings(
  db: SupabaseClient,
  listings: Listing[]
): Promise<ListingWithJoins[]> {
  if (!listings.length) return [];
  const ids = listings.map((l) => l.id);
  const { data, error } = await db
    .from("listings")
    .select(LISTING_SELECT)
    .in("id", ids);
  if (error) throw error;
  const byId = new Map((data as unknown as ListingWithJoins[]).map((l) => [l.id, l]));
  return listings.map((l) => byId.get(l.id) ?? l);
}

export async function fetchListing(
  db: SupabaseClient,
  id: string
): Promise<ListingWithJoins | null> {
  const { data, error } = await db
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ListingWithJoins | null;
}

export async function fetchMyListings(
  db: SupabaseClient,
  providerId: string
): Promise<ListingWithJoins[]> {
  const { data, error } = await db
    .from("listings")
    .select(LISTING_SELECT)
    .eq("provider_id", providerId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ListingWithJoins[];
}

export async function getOrCreateConversation(
  db: SupabaseClient,
  listing: Listing,
  customerId: string
): Promise<Conversation> {
  const { data: existing } = await db
    .from("conversations")
    .select("*")
    .eq("listing_id", listing.id)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (existing) return existing as Conversation;

  const { data, error } = await db
    .from("conversations")
    .insert({
      listing_id: listing.id,
      customer_id: customerId,
      provider_id: listing.provider_id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function fetchConversations(
  db: SupabaseClient,
  userId: string
): Promise<Conversation[]> {
  const { data, error } = await db
    .from("conversations")
    .select("*, listing:listings(*), customer:profiles!conversations_customer_id_fkey(*), provider:profiles!conversations_provider_id_fkey(*)")
    .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Conversation[];
}

export async function fetchMessages(
  db: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(
  db: SupabaseClient,
  conversationId: string,
  senderId: string,
  body: string
): Promise<Message> {
  const { data, error } = await db
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data as Message;
}

export async function createBookingRequest(
  db: SupabaseClient,
  input: {
    listing: Listing;
    customerId: string;
    requestedAt: string;
    address?: string;
    details?: string;
  }
): Promise<BookingRequest> {
  const { data, error } = await db
    .from("booking_requests")
    .insert({
      listing_id: input.listing.id,
      customer_id: input.customerId,
      provider_id: input.listing.provider_id,
      requested_at: input.requestedAt,
      address: input.address ?? null,
      details: input.details ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as BookingRequest;
}

export async function fetchBookings(
  db: SupabaseClient,
  userId: string
): Promise<BookingRequest[]> {
  const { data, error } = await db
    .from("booking_requests")
    .select("*, listing:listings(*), customer:profiles!booking_requests_customer_id_fkey(*), provider:profiles!booking_requests_provider_id_fkey(*)")
    .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as BookingRequest[];
}

export async function updateBookingStatus(
  db: SupabaseClient,
  id: string,
  status: BookingRequest["status"]
): Promise<void> {
  const { error } = await db.from("booking_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchProfile(
  db: SupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
