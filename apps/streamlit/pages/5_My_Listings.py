import streamlit as st

from lib.auth import current_user, require_login
from lib.queries import fetch_my_listings, price_label, set_listing_status
from lib.supabase_client import get_client
from lib.ui import apply_theme

st.set_page_config(page_title="My Listings · LocalServe", page_icon="🗂️", layout="wide")
apply_theme()
st.title("🗂️ My listings")

if not require_login("to manage your listings"):
    st.stop()

db = get_client()
user = current_user()
listings = fetch_my_listings(db, user.id)

if not listings:
    st.info("You haven't posted any services yet. Head to **Post a Service**.")
    st.stop()

for listing in listings:
    with st.container(border=True):
        c1, c2, c3 = st.columns([3, 1, 2])
        with c1:
            st.markdown(f"**{listing['title']}**")
            st.caption(f"{price_label(listing)} · {listing['status']}")
        with c2:
            if st.button("View", key=f"mv_{listing['id']}"):
                st.session_state["selected_listing_id"] = listing["id"]
                st.switch_page("pages/1_Listing.py")
        with c3:
            b1, b2 = st.columns(2)
            toggle_label = "Pause" if listing["status"] == "active" else "Activate"
            if b1.button(toggle_label, key=f"toggle_{listing['id']}"):
                set_listing_status(
                    db, listing["id"], "paused" if listing["status"] == "active" else "active"
                )
                st.rerun()
            if b2.button("Delete", key=f"del_{listing['id']}"):
                set_listing_status(db, listing["id"], "deleted")
                st.rerun()
