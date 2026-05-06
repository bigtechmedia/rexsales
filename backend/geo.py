"""Geo utilities: Haversine distance + geo-fence containment."""
import math
from typing import Optional, Dict, Any

R_EARTH_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in kilometres between two points."""
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R_EARTH_KM * c


def is_within_fence(point: Optional[Dict[str, Any]], center: Optional[Dict[str, Any]], radius_km: Optional[float]) -> Optional[bool]:
    """Return None if unknown (missing point or center), else True/False."""
    if not point or not center or radius_km in (None, 0):
        return None
    try:
        lat1 = float(point.get('lat'))
        lng1 = float(point.get('lng'))
        lat2 = float(center.get('lat'))
        lng2 = float(center.get('lng'))
    except (TypeError, ValueError):
        return None
    d = haversine_km(lat1, lng1, lat2, lng2)
    return d <= float(radius_km)


def distance_to_fence_km(point: Optional[Dict[str, Any]], center: Optional[Dict[str, Any]]) -> Optional[float]:
    if not point or not center:
        return None
    try:
        return round(haversine_km(float(point['lat']), float(point['lng']), float(center['lat']), float(center['lng'])), 3)
    except Exception:
        return None
