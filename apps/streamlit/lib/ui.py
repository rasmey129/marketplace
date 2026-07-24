"""Small shared UI helpers so every page has the same look and spacing."""

import streamlit as st

_CSS = """
<style>
/* Tighten the default top padding so pages start higher */
.block-container { padding-top: 2.5rem; padding-bottom: 4rem; max-width: 1200px; }

/* Hero header used on the browse page */
.ls-hero h1 { font-size: 2.4rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
.ls-hero p  { color: var(--text-color-secondary, #6b7280); margin: .35rem 0 0; font-size: 1.05rem; }

/* Bordered containers behave like cards with a subtle hover lift */
div[data-testid="stVerticalBlockBorderWrapper"] {
    border-radius: 14px;
    transition: border-color .15s ease, transform .15s ease;
}
div[data-testid="stVerticalBlockBorderWrapper"]:hover {
    border-color: rgba(34,197,94,.55);
    transform: translateY(-2px);
}

/* Buttons: rounded, full-height, no jitter */
.stButton > button {
    border-radius: 10px;
    font-weight: 600;
}

/* Images in cards get rounded corners */
div[data-testid="stImage"] img { border-radius: 10px; }
</style>
"""


def apply_theme() -> None:
    """Inject shared CSS. Safe to call once per page (top of the script)."""
    st.markdown(_CSS, unsafe_allow_html=True)


def hero(title: str, subtitle: str = "") -> None:
    sub = f"<p>{subtitle}</p>" if subtitle else ""
    st.markdown(f"<div class='ls-hero'><h1>{title}</h1>{sub}</div>", unsafe_allow_html=True)
