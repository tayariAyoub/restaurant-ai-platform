import math
from urllib.parse import urlencode

import httpx


def geocode(address: str) -> tuple[float, float] | None:
    """Best-effort OpenStreetMap geocoding; ordering still works if it is unavailable."""
    try:
        response = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "jsonv2", "limit": 1},
            headers={"User-Agent": "RestaurantAI-MVP/1.0"},
            timeout=4,
        )
        response.raise_for_status()
        results = response.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        return None
    return None


def distance_km(first: tuple[float, float], second: tuple[float, float]) -> float:
    lat1, lon1 = map(math.radians, first)
    lat2, lon2 = map(math.radians, second)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return round(6371 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value)), 2)


def osm_route_url(origin: str, destination: str) -> str:
    return f"https://www.openstreetmap.org/directions?{urlencode({'from': origin, 'to': destination})}"
