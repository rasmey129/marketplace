import streamlit as st

from lib.auth import current_profile, current_user, sign_out
from lib.geo import lookup_zip, miles_to_km
from lib.queries import fetch_categories, fetch_listings, price_label, time_ago
from lib.supabase_client import get_client
from lib.ui import apply_theme, hero

st.set_page_config(page_title="LocalServe", page_icon="🧰", layout="wide")
apply_theme()

with st.sidebar:
    st.title("🧰 LocalServe")
    st.caption("Local services marketplace — Streamlit demo")
    user = current_user()
    if user:
        profile = current_profile()
        st.success(f"Signed in as **{(profile or {}).get('full_name') or user.email}**")
        if st.button("Sign out", use_container_width=True):
            sign_out()
            st.rerun()
    else:
        st.info("Browsing as a guest. Sign in from the **Account** page to message providers or book services.")

hero(
    "Local services near you",
    "Detailing, handyman, mobile mechanic and more — from people in your area.",
)

db = get_client()
categories = fetch_categories(db)
cat_by_label = {"All categories": None}
for c in categories:
    cat_by_label[f"{c['icon']} {c['name']}"] = c["id"]

RADIUS_CHOICES = [10, 25, 50, 100]

# --- Filter bar -----------------------------------------------------------
col1, col2, col3, col4 = st.columns([4, 3, 2, 2])
query = col1.text_input("Search", placeholder="🔍  Search services…", label_visibility="collapsed")
label = col2.selectbox("Category", list(cat_by_label.keys()), label_visibility="collapsed")
zip_code = col3.text_input(
    "ZIP", placeholder="ZIP code", label_visibility="collapsed", max_chars=10
)
radius_mi = col4.selectbox(
    "Radius",
    RADIUS_CHOICES,
    index=1,
    format_func=lambda m: f"within {m} mi",
    label_visibility="collapsed",
    disabled=not zip_code.strip(),
)

# Turn the ZIP into coordinates for the geo search. Empty ZIP → browse all.
place = lookup_zip(zip_code) if zip_code.strip() else None
if zip_code.strip():
    if place:
        st.caption(f"📍 Showing services within {radius_mi} mi of {place.label} ({zip_code.strip()})")
    else:
        st.caption(f"⚠️ Couldn't find ZIP “{zip_code.strip()}” — showing all listings instead.")

listings = fetch_listings(
    db,
    category_id=cat_by_label[label],
    query=query or None,
    lat=place.lat if place else None,
    lng=place.lng if place else None,
    radius_km=miles_to_km(radius_mi),
)

st.write("")  # small breathing room above the grid

if not listings:
    st.info("No services found. Try a different search, or post the first one from **Post a Service**.")
else:
    cols = st.columns(4)
    for i, listing in enumerate(listings):
        with cols[i % 4]:
            with st.container(border=True):
                photo = (listing.get("photos") or [None])[0]
                if photo:
                    st.image(photo, use_container_width=True)
                else:
                    st.markdown(
                        f"<div style='font-size:48px;text-align:center;padding:24px 0;'>"
                        f"{(listing.get('category') or {}).get('icon', '🔧')}</div>",
                        unsafe_allow_html=True,
                    )
                st.markdown(f"**{listing['title']}**")
                st.markdown(f":green[{price_label(listing)}]")
                cat = listing.get("category") or {}
                city = listing.get("city")
                st.caption(f"{cat.get('name', '')}" + (f" · {city}" if city else ""))
                provider = listing.get("provider") or {}
                st.caption(f"{provider.get('full_name', 'Provider')} · {time_ago(listing['created_at'])}")
                if st.button("View", key=f"view_{listing['id']}", use_container_width=True):
                    st.session_state["selected_listing_id"] = listing["id"]
                    st.switch_page("pages/1_Listing.py")
