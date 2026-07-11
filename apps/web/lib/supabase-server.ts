import { createClient } from "@supabase/supabase-js";

// Anonymous server-side client for public data (browse, listing detail).
// Auth-required pages use the browser client instead.
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
