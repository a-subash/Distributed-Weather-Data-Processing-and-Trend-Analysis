from typing import Any, Dict, List

import numpy as np

from ..db import mongo
from .processor import get_last_30_by_city

try:
    from statsmodels.tsa.arima.model import ARIMA
except Exception:
    ARIMA = None  # type: ignore


def predict_next_7(city: str) -> Dict[str, Any]:
    hist = get_last_30_by_city(city)
    if not hist:
        base = 25.0
        days = [{"day": i + 1, "temp": base} for i in range(7)]
        return {"city": city, "forecast": days, "metrics": {"MAE": 0.0, "RMSE": 0.0}}
    y = [h.get("temp") or 0.0 for h in hist]
    if ARIMA is None or len(y) < 10:
        vals = y[-1] if y else 25.0
        days = [{"day": i + 1, "temp": float(vals)} for i in range(7)]
        return {"city": city, "forecast": days, "metrics": {"MAE": 0.0, "RMSE": 0.0}}
    try:
        model = ARIMA(y, order=(5, 1, 0))
        res = model.fit()
        fc = res.forecast(steps=7)
        preds = [float(v) for v in fc]
        true = y[-7:] if len(y) >= 7 else y
        if true:
            m = min(len(true), len(preds))
            err = np.array(true[-m:]) - np.array(preds[:m])
            mae = float(np.mean(np.abs(err)))
            rmse = float(np.sqrt(np.mean(err**2)))
        else:
            mae = 0.0
            rmse = 0.0
        days = [{"day": i + 1, "temp": preds[i]} for i in range(7)]
        return {"city": city, "forecast": days, "metrics": {"MAE": mae, "RMSE": rmse}}
    except Exception:
        vals = y[-1] if y else 25.0
        days = [{"day": i + 1, "temp": float(vals)} for i in range(7)]
        return {"city": city, "forecast": days, "metrics": {"MAE": 0.0, "RMSE": 0.0}}
