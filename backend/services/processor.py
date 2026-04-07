import time
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from ..db import mongo


def process_and_store(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not entries:
        return {"records": 0, "aggregations": {}}
    df = pd.DataFrame(entries)
    df["timestamp"] = df.get("timestamp", pd.Timestamp.utcnow().timestamp())
    agg = (
        df.groupby("city")
        .agg(
            avg_temp=("temp", "mean"),
            max_wind=("wind_speed", "max"),
            min_pressure=("pressure", "min"),
        )
        .reset_index()
    )
    records = df.to_dict("records")
    mongo.insert_many("weather", records)
    return {"records": len(records), "aggregations": agg.to_dict("records")}


def get_last_30_by_city(city: str) -> List[Dict[str, Any]]:
    recs = mongo.get_recent_data("weather", city, 30)
    recs = sorted(recs, key=lambda x: x.get("timestamp", 0))
    return recs
