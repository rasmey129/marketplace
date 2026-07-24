import streamlit as st

from lib.auth import current_profile, current_user, refresh_profile, require_login, sign_out
from lib.queries import update_profile
from lib.supabase_client import get_client
from lib.ui import apply_theme

st.set_page_config(page_title="Account · LocalServe", page_icon="👤", layout="centered")
apply_theme()
st.title("👤 Account")

if not require_login():
    st.stop()

db = get_client()
user = current_user()
profile = current_profile() or {}

st.success(f"Signed in as {user.email}")
if st.button("Sign out"):
    sign_out()
    st.rerun()

st.divider()
st.subheader("Your profile")
with st.form("profile_form"):
    full_name = st.text_input("Full name", value=profile.get("full_name", ""))
    city = st.text_input("City / area", value=profile.get("city") or "")
    phone = st.text_input("Phone (shown after booking)", value=profile.get("phone") or "")
    bio = st.text_area("Bio", value=profile.get("bio") or "")
    submitted = st.form_submit_button("Save profile", use_container_width=True)

if submitted:
    update_profile(db, user.id, full_name=full_name, city=city or None, phone=phone or None, bio=bio or None)
    refresh_profile()
    st.success("Profile saved.")
