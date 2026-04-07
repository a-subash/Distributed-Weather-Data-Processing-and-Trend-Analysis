from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from ..config import CITIES
from ..services.fetcher import fetch_all_live, fetch_city_live, fetch_city_forecast, fetch_city_aqi
from ..services.processor import process_and_store
from ..services.anomaly import list_anomalies
from ..db import mongo

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/live")
async def live_weather():
    data = await fetch_all_live(CITIES)
    res = process_and_store(data)
    return {"data": data, "aggregations": res["aggregations"], "records": res["records"]}


@router.get("/city/{city_name}")
async def city_weather(city_name: str):
    items = await fetch_all_live([city_name])
    data = items[0] if items else {}
    process_and_store([data])
    return data


@router.get("/forecast/{city_name}")
async def city_forecast(city_name: str):
    f = await fetch_city_forecast(city_name)
    return f


@router.get("/aqi/{city_name}")
async def city_aqi(city_name: str):
    a = await fetch_city_aqi(city_name)
    return a


@router.get("/anomalies")
async def anomalies():
    return {"items": list_anomalies(50)}


@router.get("/history")
async def history():
    items = mongo.get_history_days("weather", 7)
    return {"items": items}
