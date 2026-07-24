import streamlit as st

from lib.auth import current_user, require_login
from lib.queries import fetch_bookings, update_booking_status
from lib.supabase_client import get_client
from lib.ui import apply_theme

st.set_page_config(page_title="Bookings · LocalServe", page_icon="📅", layout="wide")
apply_theme()
st.title("📅 Bookings")

if not require_login("to view your bookings"):
    st.stop()

db = get_client()
user = current_user()
bookings = fetch_bookings(db, user.id)

if not bookings:
    st.info("No booking requests yet.")
    st.stop()

STATUS_COLOR = {
    "pending": "orange",
    "accepted": "green",
    "declined": "red",
    "cancelled": "gray",
    "completed": "blue",
}


def render_booking(b, role):
    other = b["customer"] if role == "provider" else b["provider"]
    with st.container(border=True):
        c1, c2 = st.columns([3, 1])
        c1.markdown(f"**{b['listing']['title']}**")
        c2.markdown(f":{STATUS_COLOR.get(b['status'], 'gray')}[{b['status'].upper()}]")
        st.caption(
            f"{'From' if role == 'provider' else 'With'} {other.get('full_name', 'user')} · "
            f"{b['requested_at'][:16].replace('T', ' ')}"
            + (f" · {b['address']}" if b.get("address") else "")
        )
        if b.get("details"):
            st.write(b["details"])

        cols = st.columns(3)
        if role == "provider" and b["status"] == "pending":
            if cols[0].button("Accept", key=f"acc_{b['id']}"):
                update_booking_status(db, b["id"], "accepted")
                st.rerun()
            if cols[1].button("Decline", key=f"dec_{b['id']}"):
                update_booking_status(db, b["id"], "declined")
                st.rerun()
        elif role == "provider" and b["status"] == "accepted":
            if cols[0].button("Mark completed", key=f"comp_{b['id']}"):
                update_booking_status(db, b["id"], "completed")
                st.rerun()
        elif role == "customer" and b["status"] in ("pending", "accepted"):
            if cols[0].button("Cancel", key=f"cxl_{b['id']}"):
                update_booking_status(db, b["id"], "cancelled")
                st.rerun()


incoming = [b for b in bookings if b["provider_id"] == user.id]
outgoing = [b for b in bookings if b["customer_id"] == user.id]

if incoming:
    st.subheader("Requests for your services")
    for b in incoming:
        render_booking(b, "provider")

if outgoing:
    st.subheader("Your requests")
    for b in outgoing:
        render_booking(b, "customer")
