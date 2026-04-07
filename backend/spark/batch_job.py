from typing import Any, Dict, List

import math
import numpy as np
import pandas as pd

from ..db import mongo

def _pandas_job(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not data:
        return {"rolling": [], "correlation": []}
    df = pd.DataFrame(data)
    df = df[["city", "timestamp", "temp", "humidity", "pressure", "wind_speed", "rain_1h"]]
    df = df.sort_values(["city", "timestamp"])
    roll = (
        df.groupby("city")[["temp", "humidity", "pressure", "wind_speed", "rain_1h"]]
        .rolling(7, min_periods=1)
        .mean()
        .reset_index()
    )
    roll = roll.rename(columns={"level_1": "index"})
    corr = df[["temp", "humidity", "pressure", "wind_speed", "rain_1h"]].corr()
    return {
        "rolling": roll.to_dict("records"),
        "correlation": corr.reset_index().rename(columns={"index": "metric"}).to_dict("records"),
    }


def run_batch_job():
    data = mongo.get_history_days("weather", 7)
    try:
        from pyspark.sql import SparkSession
        spark = SparkSession.builder.appName("WeatherBatch").getOrCreate()
        sdf = spark.createDataFrame(pd.DataFrame(data))
        cols = ["temp", "humidity", "pressure", "wind_speed", "rain_1h"]
        from pyspark.sql import functions as F, Window
        w = Window.partitionBy("city").orderBy("timestamp").rowsBetween(-6, 0)
        exprs = [F.avg(c).over(w).alias(f"{c}_avg7") for c in cols]
        roll_df = sdf.select("city", "timestamp", *exprs)
        pdf_roll = roll_df.toPandas()
        pdf = pd.DataFrame(data)
        corr = pdf[cols].corr()
        payload = {
            "rolling": pdf_roll.to_dict("records"),
            "correlation": corr.reset_index().rename(columns={"index": "metric"}).to_dict("records"),
        }
        mongo.save_analytics("batch_results", payload)
        try:
            spark.stop()
        except Exception:
            pass
        return payload
    except Exception:
        payload = _pandas_job(data)
        mongo.save_analytics("batch_results", payload)
        return payload
