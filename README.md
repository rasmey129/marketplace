# LocalServe

A localized services marketplace — like Facebook Marketplace, but for services
(auto detailing, handyman, mobile mechanic, cleaning, and more). Providers post
listings; customers browse nearby, chat in realtime, and send booking requests.

## Structure

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js 16 website (Tailwind v4) |
| `apps/mobile` | Expo (React Native) iOS/Android app |
| `packages/shared` | Shared TypeScript types + Supabase query helpers |
| `supabase/migrations` | Database schema, RLS policies, seed categories |

## Features (v1)

- Browse/search listings by category, keyword, and "near me" geo radius
- Post a service with photos, pricing (fixed / hourly / quote), city, service radius
- Realtime 1:1 chat between customers and providers (Supabase Realtime)
- Booking requests: customers request a date/time; providers accept, decline,
  or mark completed; customers can cancel
- Email/password auth with auto-created profiles

Payments are intentionally off-platform for now (Stripe planned later).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com), then run
   `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`
   with the CLI). This creates all tables, RLS policies, the seeded categories,
   the `listings_nearby` geo-search function, and the `listing-photos` storage bucket.
2. **Enable Realtime** for the `messages` table (Database → Replication).
3. **Configure env vars**:
   - `apps/web/.env.local` — copy from `.env.local.example`
   - `apps/mobile/.env` — copy from `.env.example`
4. **Install & run**:

```bash
npm install
npm run dev:web      # website at http://localhost:3000
npm run dev:mobile   # Expo dev server (scan QR with Expo Go)
```

## Notes

- Mobile photo upload isn't wired up yet — add photos from the web for now.
- Geo search uses Postgres `earthdistance`; listings capture lat/lng from the
  browser when posting, and "Near me" filters within a radius (default 40 km).
- Next steps: reviews & ratings, Stripe payments, push notifications,
  provider verification.
