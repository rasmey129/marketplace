import streamlit as st

from lib.auth import current_profile, current_user, require_login, sign_out
from lib.queries import fetch_categories, fetch_listings, price_label, time_ago
from lib.supabase_client import get_client

st.set_page_config(page_title="LocalServe", page_icon="🧰", layout="wide")

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

st.title("Local services near you")
st.caption("Detailing, handyman, mobile mechanic and more — from people in your area.")

db = get_client()
categories = fetch_categories(db)
cat_by_label = {"All categories": None}
for c in categories:
    cat_by_label[f"{c['icon']} {c['name']}"] = c["id"]

col1, col2, col3 = st.columns([3, 2, 1])
with col1:
    query = st.text_input("Search", placeholder="Search services…", label_visibility="collapsed")
with col2:
    label = st.selectbox("Category", list(cat_by_label.keys()), label_visibility="collapsed")
with col3:
    near_me = st.toggle("📍 Near me")

lat = lng = None
if near_me:
    st.caption("Enter your approximate location (Streamlit can't read browser GPS).")
    loc_col1, loc_col2, loc_col3 = st.columns(3)
    lat = loc_col1.number_input("Latitude", value=0.0, format="%.5f")
    lng = loc_col2.number_input("Longitude", value=0.0, format="%.5f")
    radius = loc_col3.number_input("Radius (km)", value=40, min_value=1, max_value=300)
else:
    radius = 40

listings = fetch_listings(
    db,
    category_id=cat_by_label[label],
    query=query or None,
    lat=lat if near_me and lat else None,
    lng=lng if near_me and lng else None,
    radius_km=radius,
)

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
