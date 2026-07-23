from datetime import datetime, time

import streamlit as st

from lib.auth import current_user, require_login
from lib.queries import (
    create_booking_request,
    fetch_listing,
    get_or_create_conversation,
    price_label,
    time_ago,
)
from lib.supabase_client import get_client

st.set_page_config(page_title="Listing · LocalServe", page_icon="🧰", layout="wide")

db = get_client()
listing_id = st.session_state.get("selected_listing_id")
if not listing_id:
    st.warning("No listing selected. Go back to Browse and pick one.")
    st.stop()

listing = fetch_listing(db, listing_id)
if not listing or listing.get("status") == "deleted":
    st.error("This listing no longer exists.")
    st.stop()

col1, col2 = st.columns([2, 1])

with col1:
    photos = listing.get("photos") or []
    if photos:
        st.image(photos[0], use_container_width=True)
        if len(photos) > 1:
            st.image(photos[1:], width=160)
    else:
        st.markdown(
            f"<div style='font-size:96px;text-align:center;padding:48px 0;background:#f4f4f5;"
            f"border-radius:12px;'>{(listing.get('category') or {}).get('icon', '🔧')}</div>",
            unsafe_allow_html=True,
        )
    st.subheader("About this service")
    st.write(listing.get("description") or "No description provided.")

with col2:
    cat = listing.get("category") or {}
    st.caption(f"{cat.get('icon', '')} {cat.get('name', '')}" + (f" · {listing['city']}" if listing.get("city") else ""))
    st.markdown(f"## {listing['title']}")
    st.markdown(f"### :green[{price_label(listing)}]")
    st.caption(
        f"Posted {time_ago(listing['created_at'])} · serves within "
        f"{listing.get('service_radius_km', 25)} km"
    )

    provider = listing.get("provider") or {}
    with st.container(border=True):
        st.markdown(f"**Provider:** {provider.get('full_name', 'Provider')}")
        if provider.get("city"):
            st.caption(provider["city"])
        if provider.get("bio"):
            st.write(provider["bio"])

    user = current_user()
    is_owner = user and user.id == listing["provider_id"]

    if is_owner:
        st.info("This is your listing. Manage it from **My Listings**.")
    elif not user:
        st.warning("Sign in from the **Account** page to message the provider or request a booking.")
    else:
        if st.button("💬 Message provider", use_container_width=True):
            convo = get_or_create_conversation(db, listing, user.id)
            st.session_state["selected_conversation_id"] = convo["id"]
            st.switch_page("pages/2_Messages.py")

        with st.expander("📅 Request a booking"):
            with st.form("booking_form"):
                date = st.date_input("Date")
                request_time = st.time_input("Time", value=time(9, 0))
                address = st.text_input("Service address (optional)")
                details = st.text_area("Describe the job…")
                submitted = st.form_submit_button("Send request", use_container_width=True)
            if submitted:
                requested_at = datetime.combine(date, request_time).isoformat()
                create_booking_request(
                    db,
                    listing,
                    user.id,
                    requested_at=requested_at,
                    address=address or None,
                    details=details or "",
                )
                st.success("Booking request sent! Track it on the **Bookings** page.")
