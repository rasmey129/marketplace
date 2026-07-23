"""Auth helpers: login/signup form + current-user/profile lookup, backed by
Supabase email/password auth (the same accounts used by the web and mobile
apps — they share one `auth.users` table)."""

import streamlit as st

from .supabase_client import get_client


def current_user():
    session = st.session_state.get("auth_session")
    return session["user"] if session else None


def current_profile():
    user = current_user()
    if not user:
        return None
    if st.session_state.get("_profile_for") != user.id:
        db = get_client()
        res = db.table("profiles").select("*").eq("id", user.id).maybe_single().execute()
        st.session_state["_profile"] = res.data if res else None
        st.session_state["_profile_for"] = user.id
    return st.session_state.get("_profile")


def refresh_profile():
    st.session_state.pop("_profile_for", None)


def sign_out():
    db = get_client()
    try:
        db.auth.sign_out()
    except Exception:
        pass
    for key in ("auth_session", "_profile", "_profile_for"):
        st.session_state.pop(key, None)


def require_login(next_hint: str = "") -> bool:
    """Render a login/signup form. Returns True once a user is signed in."""
    user = current_user()
    if user:
        return True

    st.info("Sign in to continue." + (f" ({next_hint})" if next_hint else ""))
    mode = st.radio("", ["Sign in", "Sign up"], horizontal=True, label_visibility="collapsed")

    with st.form(f"auth_form_{mode}"):
        full_name = st.text_input("Full name") if mode == "Sign up" else None
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button(mode)

    if not submitted:
        return False

    db = get_client()
    try:
        if mode == "Sign up":
            result = db.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {"data": {"full_name": full_name or ""}},
                }
            )
            if not result.session:
                st.success("Check your email to confirm your account, then sign in.")
                return False
        else:
            result = db.auth.sign_in_with_password({"email": email, "password": password})

        st.session_state["auth_session"] = {
            "access_token": result.session.access_token,
            "user": result.user,
        }
        st.rerun()
    except Exception as e:
        st.error(str(e))
    return False
