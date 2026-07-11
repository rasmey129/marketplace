export type PriceUnit = "fixed" | "hourly" | "quote";
export type ListingStatus = "active" | "paused" | "deleted";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_provider: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export interface Listing {
  id: string;
  provider_id: string;
  category_id: number;
  title: string;
  description: string;
  price: number | null;
  price_unit: PriceUnit;
  photos: string[];
  city: string | null;
  lat: number | null;
  lng: number | null;
  service_radius_km: number;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingWithJoins extends Listing {
  provider?: Profile;
  category?: Category;
}

export interface Conversation {
  id: string;
  listing_id: string;
  customer_id: string;
  provider_id: string;
  created_at: string;
  listing?: Listing;
  customer?: Profile;
  provider?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface BookingRequest {
  id: string;
  listing_id: string;
  customer_id: string;
  provider_id: string;
  requested_at: string;
  address: string | null;
  details: string;
  status: BookingStatus;
  created_at: string;
  listing?: Listing;
  customer?: Profile;
  provider?: Profile;
}
