import streamlit as st

from lib.auth import current_user, require_login
from lib.queries import create_listing, fetch_categories
from lib.supabase_client import get_client

st.set_page_config(page_title="Post a Service · LocalServe", page_icon="➕", layout="centered")
st.title("➕ Post a service")
st.caption("Tell your neighbors what you offer. Your listing appears in local search right away.")

if not require_login("to post a service"):
    st.stop()

db = get_client()
user = current_user()
categories = fetch_categories(db)
cat_by_label = {f"{c['icon']} {c['name']}": c["id"] for c in categories}

with st.form("post_service"):
    title = st.text_input("Title", placeholder="Full interior & exterior detail")
    category_label = st.selectbox("Category", list(cat_by_label.keys()))
    description = st.text_area("Description", height=140, placeholder="What's included, your experience…")

    col1, col2 = st.columns(2)
    price_unit = col1.selectbox("Pricing", ["quote", "fixed", "hourly"], format_func=lambda u: {
        "quote": "Price on request", "fixed": "Fixed price", "hourly": "Hourly rate",
    }[u])
    price = col2.number_input("Price ($)", min_value=0.0, step=1.0, disabled=(price_unit == "quote"))

    col3, col4 = st.columns(2)
    city = col3.text_input("City / area", placeholder="Long Beach, CA")
    radius = col4.number_input("Service radius (km)", min_value=1, max_value=200, value=25)

    photo_urls_raw = st.text_area(
        "Photo URLs (one per line, optional)",
        placeholder="https://…\nhttps://…",
        help="Streamlit demo doesn't upload files — paste image URLs, or add photos from the website.",
    )

    submitted = st.form_submit_button("Publish listing", use_container_width=True)

if submitted:
    if not title or not description or category_label not in cat_by_label:
        st.error("Title, category, and description are required.")
    else:
        photos = [u.strip() for u in photo_urls_raw.splitlines() if u.strip()]
        listing = create_listing(
            db,
            user.id,
            category_id=cat_by_label[category_label],
            title=title,
            description=description,
            price=None if price_unit == "quote" else price,
            price_unit=price_unit,
            city=city or None,
            service_radius_km=int(radius),
            photos=photos,
        )
        st.success("Listing published!")
        st.session_state["selected_listing_id"] = listing["id"]
        st.switch_page("pages/1_Listing.py")
