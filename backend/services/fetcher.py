import asyncio
import random
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..config import CITIES, get_api_key

BASE_URL = "https://api.openweathermap.org/data/2.5"


def _sample_weather(city: str) -> Dict[str, Any]:
    temp = round(random.uniform(10, 40), 2)
    humidity = random.randint(30, 95)
    wind = round(random.uniform(0, 18), 2)
    pressure = random.randint(980, 1035)
    rain = round(max(0.0, random.gauss(1.5, 2.0)), 2)
    lat = round(random.uniform(-90, 90), 4)
    lon = round(random.uniform(-180, 180), 4)
    return {
        "city": city,
        "timestamp": time.time(),
        "weather": {"temp": temp, "humidity": humidity, "pressure": pressure},
        "wind": {"speed": wind},
        "rain": {"1h": rain},
        "coord": {"lat": lat, "lon": lon},
        "aqi": {"aqi": random.randint(1, 5)},
    }


async def _fetch_json(client: httpx.AsyncClient, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        r = await client.get(url, params=params, timeout=8)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def _normalize_live(city: str, weather: Dict[str, Any], aqi: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    coord = weather.get("coord", {})
    aqi_val = None
    if aqi and aqi.get("list"):
        aqi_val = aqi["list"][0]["main"].get("aqi")
    return {
        "city": city,
        "timestamp": time.time(),
        "temp": weather.get("main", {}).get("temp"),
        "humidity": weather.get("main", {}).get("humidity"),
        "pressure": weather.get("main", {}).get("pressure"),
        "wind_speed": weather.get("wind", {}).get("speed"),
        "rain_1h": weather.get("rain", {}).get("1h", 0.0),
        "lat": coord.get("lat"),
        "lon": coord.get("lon"),
        "aqi": aqi_val,
    }


async def fetch_city_live(client: httpx.AsyncClient, city: str) -> Dict[str, Any]:
    w = await _fetch_json(
        client,
        f"{BASE_URL}/weather",
        {"q": city, "appid": get_api_key(), "units": "metric"},
    )
    if w is None:
        return _sample_weather(city)
    coord = w.get("coord", {})
    a = None
    if coord:
        a = await _fetch_json(
            client,
            f"{BASE_URL}/air_pollution",
            {"lat": coord.get("lat"), "lon": coord.get("lon"), "appid": get_api_key()},
        )
    return _normalize_live(city, w, a)


async def fetch_all_live(cities: List[str] = CITIES) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        tasks = [fetch_city_live(client, c) for c in cities]
        res = await asyncio.gather(*tasks)
        return res


async def fetch_city_forecast(city: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        f = await _fetch_json(
            client,
            f"{BASE_URL}/forecast",
            {"q": city, "appid": get_api_key(), "units": "metric"},
        )
        if f is None or not f.get("list"):
            base = _sample_weather(city)
            series = []
            t0 = int(time.time())
            for i in range(40):
                series.append(
                    {
                        "dt": t0 + i * 3 * 3600,
                        "main": {"temp": base["weather"]["temp"] + random.uniform(-2, 2)},
                    }
                )
            return {"city": city, "list": series}
        return f


async def fetch_city_aqi(city: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        w = await _fetch_json(
            client,
            f"{BASE_URL}/weather",
            {"q": city, "appid": get_api_key(), "units": "metric"},
        )
        if w is None:
            s = _sample_weather(city)
            return {"list": [{"main": {"aqi": s["aqi"]["aqi"]}, "dt": int(time.time())}]}
        coord = w.get("coord", {})
        a = await _fetch_json(
            client,
            f"{BASE_URL}/air_pollution",
            {"lat": coord.get("lat"), "lon": coord.get("lon"), "appid": get_api_key()},
        )
        if a is None:
            s = _sample_weather(city)
            return {"list": [{"main": {"aqi": s["aqi"]["aqi"]}, "dt": int(time.time())}]}
        return a
