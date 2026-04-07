import time
from typing import Any, Dict, List, Optional

from ..db import mongo

_last: Dict[str, Dict[str, Any]] = {}


def evaluate(current: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    city = current.get("city")
    now = current.get("timestamp", time.time())
    prev = _last.get(city)
    _last[city] = current
    if prev is None:
        return None
    anomalies: List[Dict[str, Any]] = []
    d_temp = (current.get("temp") or 0) - (prev.get("temp") or 0)
    d_press = (prev.get("pressure") or 0) - (current.get("pressure") or 0)
    d_wind = (current.get("wind_speed") or 0) - (prev.get("wind_speed") or 0)
    if abs(d_temp) > 8:
        anomalies.append({"type": "temp_change", "delta": round(d_temp, 2)})
    if d_press > 15:
        anomalies.append({"type": "pressure_drop", "delta": round(d_press, 2)})
    if d_wind > 20 / 3.6:
        anomalies.append({"type": "wind_spike", "delta": round(d_wind * 3.6, 2)})
    if not anomalies:
        return None
    sev = "LOW"
    if any(a["type"] == "pressure_drop" for a in anomalies) and abs(d_temp) > 10:
        sev = "CRITICAL"
    elif abs(d_temp) > 10 or d_wind > 30 / 3.6:
        sev = "HIGH"
    elif abs(d_temp) > 9 or d_wind > 25 / 3.6:
        sev = "MEDIUM"
    payload = {
        "city": city,
        "severity": sev,
        "description": ", ".join([a["type"] for a in anomalies]),
        "timestamp": now,
    }
    mongo.add_anomaly(payload)
    return payload


def list_anomalies(limit: int = 50) -> List[Dict[str, Any]]:
    return mongo.get_anomalies(limit)
