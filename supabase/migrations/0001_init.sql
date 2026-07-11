-- LocalServe: local services marketplace schema
create extension if not exists "uuid-ossp";
create extension if not exists earthdistance cascade;

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  bio text,
  phone text,
  city text,
  lat double precision,
  lng double precision,
  is_provider boolean not null default false,
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Categories ----------
create table public.categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  icon text not null default '🔧'
);

insert into public.categories (slug, name, icon) values
  ('auto-detailing', 'Auto Detailing', '🚗'),
  ('mobile-mechanic', 'Mobile Mechanic', '🔧'),
  ('handyman', 'Handyman', '🔨'),
  ('cleaning', 'Home Cleaning', '🧹'),
  ('landscaping', 'Lawn & Landscaping', '🌿'),
  ('moving', 'Moving & Hauling', '📦'),
  ('electrical', 'Electrical', '⚡'),
  ('plumbing', 'Plumbing', '🚰'),
  ('painting', 'Painting', '🎨'),
  ('pet-care', 'Pet Care', '🐕'),
  ('beauty', 'Beauty & Barber', '💇'),
  ('tech-help', 'Tech Help', '💻'),
  ('photography', 'Photography', '📷'),
  ('tutoring', 'Tutoring', '📚'),
  ('other', 'Other', '✨');

-- ---------- Listings ----------
create type public.price_unit as enum ('fixed', 'hourly', 'quote');
create type public.listing_status as enum ('active', 'paused', 'deleted');

create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  category_id int not null references public.categories (id),
  title text not null,
  description text not null default '',
  price numeric(10,2),
  price_unit public.price_unit not null default 'quote',
  photos text[] not null default '{}',
  city text,
  lat double precision,
  lng double precision,
  service_radius_km int not null default 25,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_category_idx on public.listings (category_id) where status = 'active';
create index listings_geo_idx on public.listings using gist (ll_to_earth(lat, lng));

-- ---------- Conversations & messages ----------
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, customer_id)
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------- Booking requests ----------
create type public.booking_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'completed');

create table public.booking_requests (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  requested_at timestamptz not null,
  address text,
  details text not null default '',
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index bookings_provider_idx on public.booking_requests (provider_id, status);
create index bookings_customer_idx on public.booking_requests (customer_id, status);

-- ---------- Nearby search RPC ----------
create or replace function public.listings_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 40,
  p_category int default null,
  p_query text default null
) returns setof public.listings language sql stable as $$
  select l.* from public.listings l
  where l.status = 'active'
    and (p_category is null or l.category_id = p_category)
    and (p_query is null or l.title ilike '%' || p_query || '%' or l.description ilike '%' || p_query || '%')
    and (
      l.lat is null or p_lat is null
      or earth_distance(ll_to_earth(l.lat, l.lng), ll_to_earth(p_lat, p_lng)) <= p_radius_km * 1000
    )
  order by l.created_at desc;
$$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.booking_requests enable row level security;

create policy "profiles are viewable by everyone" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "categories are public" on public.categories for select using (true);

create policy "active listings are public" on public.listings
  for select using (status = 'active' or provider_id = auth.uid());
create policy "providers insert own listings" on public.listings
  for insert with check (provider_id = auth.uid());
create policy "providers update own listings" on public.listings
  for update using (provider_id = auth.uid());
create policy "providers delete own listings" on public.listings
  for delete using (provider_id = auth.uid());

create policy "participants see conversations" on public.conversations
  for select using (auth.uid() in (customer_id, provider_id));
create policy "customers start conversations" on public.conversations
  for insert with check (auth.uid() = customer_id);

create policy "participants see messages" on public.messages
  for select using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.customer_id, c.provider_id)));
create policy "participants send messages" on public.messages
  for insert with check (sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.customer_id, c.provider_id)));

create policy "parties see bookings" on public.booking_requests
  for select using (auth.uid() in (customer_id, provider_id));
create policy "customers create bookings" on public.booking_requests
  for insert with check (customer_id = auth.uid());
create policy "parties update bookings" on public.booking_requests
  for update using (auth.uid() in (customer_id, provider_id));

-- ---------- Storage bucket for listing photos ----------
insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "anyone can view listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');
create policy "authenticated users upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');
