"""Supabase client wiring for the Streamlit demo.

Uses one anon-key client per session, with the user's access token attached
after sign-in so RLS policies (auth.uid()) apply correctly — same policies
the web and mobile apps use.
"""

import os

import streamlit as st
from supabase import Client, create_client


def _config_value(key: str) -> str:
    # st.secrets works once .streamlit/secrets.toml exists; fall back to env
    # vars so the app also runs from a plain .env / shell export.
    try:
        if key in st.secrets:
            return st.secrets[key]
    except FileNotFoundError:
        pass
    value = os.environ.get(key)
    if not value:
        st.error(
            f"Missing `{key}`. Copy `.streamlit/secrets.toml.example` to "
            "`.streamlit/secrets.toml` and fill in your Supabase project values."
        )
        st.stop()
    return value


@st.cache_resource(show_spinner=False)
def _base_client() -> Client:
    url = _config_value("SUPABASE_URL")
    anon_key = _config_value("SUPABASE_ANON_KEY")
    return create_client(url, anon_key)


def get_client() -> Client:
    """Return a Supabase client, authenticated as the signed-in user if any."""
    client = _base_client()
    session = st.session_state.get("auth_session")
    if session:
        client.postgrest.auth(session["access_token"])
    else:
        client.postgrest.auth(_config_value("SUPABASE_ANON_KEY"))
    return client
