"""Data-access helpers mirroring packages/shared's queries.ts, so this demo
reads/writes the exact same Supabase schema as the web and mobile apps."""

from datetime import datetime, timezone

LISTING_SELECT = "*, provider:profiles(*), category:categories(*)"


def fetch_categories(db):
    res = db.table("categories").select("*").order("id").execute()
    return res.data


def fetch_listings(db, category_id=None, query=None, lat=None, lng=None, radius_km=40):
    if lat is not None and lng is not None:
        res = db.rpc(
            "listings_nearby",
            {
                "p_lat": lat,
                "p_lng": lng,
                "p_radius_km": radius_km,
                "p_category": category_id,
                "p_query": query or None,
            },
        ).execute()
        listings = res.data
        if not listings:
            return []
        ids = [l["id"] for l in listings]
        hydrated = (
            db.table("listings").select(LISTING_SELECT).in_("id", ids).execute().data
        )
        by_id = {l["id"]: l for l in hydrated}
        return [by_id.get(l["id"], l) for l in listings]

    q = (
        db.table("listings")
        .select(LISTING_SELECT)
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(60)
    )
    if category_id:
        q = q.eq("category_id", category_id)
    if query:
        q = q.or_(f"title.ilike.%{query}%,description.ilike.%{query}%")
    return q.execute().data


def fetch_listing(db, listing_id):
    res = (
        db.table("listings")
        .select(LISTING_SELECT)
        .eq("id", listing_id)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def fetch_my_listings(db, provider_id):
    res = (
        db.table("listings")
        .select(LISTING_SELECT)
        .eq("provider_id", provider_id)
        .neq("status", "deleted")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def create_listing(db, provider_id, **fields):
    payload = {"provider_id": provider_id, **fields}
    inserted = db.table("listings").insert(payload).execute().data[0]
    db.table("profiles").update({"is_provider": True}).eq("id", provider_id).execute()
    return fetch_listing(db, inserted["id"])


def set_listing_status(db, listing_id, status):
    db.table("listings").update({"status": status}).eq("id", listing_id).execute()


def get_or_create_conversation(db, listing, customer_id):
    existing = (
        db.table("conversations")
        .select("*")
        .eq("listing_id", listing["id"])
        .eq("customer_id", customer_id)
        .maybe_single()
        .execute()
    )
    if existing and existing.data:
        return existing.data
    res = (
        db.table("conversations")
        .insert(
            {
                "listing_id": listing["id"],
                "customer_id": customer_id,
                "provider_id": listing["provider_id"],
            }
        )
        .execute()
    )
    return res.data[0]


def fetch_conversations(db, user_id):
    res = (
        db.table("conversations")
        .select(
            "*, listing:listings(*), "
            "customer:profiles!conversations_customer_id_fkey(*), "
            "provider:profiles!conversations_provider_id_fkey(*)"
        )
        .or_(f"customer_id.eq.{user_id},provider_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def fetch_messages(db, conversation_id):
    res = (
        db.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return res.data


def send_message(db, conversation_id, sender_id, body):
    res = (
        db.table("messages")
        .insert({"conversation_id": conversation_id, "sender_id": sender_id, "body": body})
        .execute()
    )
    return res.data[0]


def create_booking_request(db, listing, customer_id, requested_at, address=None, details=""):
    res = (
        db.table("booking_requests")
        .insert(
            {
                "listing_id": listing["id"],
                "customer_id": customer_id,
                "provider_id": listing["provider_id"],
                "requested_at": requested_at,
                "address": address,
                "details": details or "",
            }
        )
        .execute()
    )
    return res.data[0]


def fetch_bookings(db, user_id):
    res = (
        db.table("booking_requests")
        .select(
            "*, listing:listings(*), "
            "customer:profiles!booking_requests_customer_id_fkey(*), "
            "provider:profiles!booking_requests_provider_id_fkey(*)"
        )
        .or_(f"customer_id.eq.{user_id},provider_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def update_booking_status(db, booking_id, status):
    db.table("booking_requests").update({"status": status}).eq("id", booking_id).execute()


def update_profile(db, user_id, **fields):
    db.table("profiles").update(fields).eq("id", user_id).execute()


# ---------- formatting helpers (mirrors packages/shared/src/format.ts) ----------

def price_label(listing):
    unit = listing.get("price_unit")
    price = listing.get("price")
    if unit == "quote" or price is None:
        return "Get a quote"
    amount = f"${float(price):.0f}" if float(price) % 1 == 0 else f"${float(price):.2f}"
    return f"{amount}/hr" if unit == "hourly" else amount


def time_ago(iso):
    if not iso:
        return ""
    then = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    seconds = (datetime.now(timezone.utc) - then).total_seconds()
    if seconds < 60:
        return "just now"
    minutes = int(seconds // 60)
    if minutes < 60:
        return f"{minutes}m ago"
    hours = int(minutes // 60)
    if hours < 24:
        return f"{hours}h ago"
    days = int(hours // 24)
    if days < 7:
        return f"{days}d ago"
    return then.strftime("%b %-d, %Y")
