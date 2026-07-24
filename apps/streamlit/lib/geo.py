"""ZIP-code geocoding for the Streamlit demo.

Streamlit can't read the browser's GPS, so instead of asking people to type
raw latitude/longitude we take a ZIP code and look it up offline via
``pgeocode`` (a bundled GeoNames postal dataset — no API key, no signup).
The rest of the app still works in the lat/lng the Supabase schema expects.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import pgeocode
import streamlit as st

MILES_TO_KM = 1.60934
KM_TO_MILES = 0.621371


@dataclass
class Place:
    lat: float
    lng: float
    city: str
    state: str

    @property
    def label(self) -> str:
        parts = [p for p in (self.city, self.state) if p]
        return ", ".join(parts)


@st.cache_resource(show_spinner=False)
def _nominatim(country: str = "us") -> "pgeocode.Nominatim":
    return pgeocode.Nominatim(country)


@st.cache_data(show_spinner=False)
def lookup_zip(zip_code: str, country: str = "us") -> Place | None:
    """Resolve a ZIP/postal code to a :class:`Place`, or ``None`` if unknown."""
    code = (zip_code or "").strip()
    if not code:
        return None
    rec = _nominatim(country).query_postal_code(code)
    lat, lng = rec.latitude, rec.longitude
    if lat is None or lng is None or _is_nan(lat) or _is_nan(lng):
        return None
    return Place(
        lat=float(lat),
        lng=float(lng),
        city=_clean(rec.place_name),
        state=_clean(rec.state_code),
    )


def miles_to_km(miles: float) -> float:
    return miles * MILES_TO_KM


def km_to_miles(km: float) -> int:
    return round(km * KM_TO_MILES)


def _is_nan(value) -> bool:
    return isinstance(value, float) and math.isnan(value)


def _clean(value) -> str:
    if value is None or _is_nan(value):
        return ""
    return str(value).strip()
