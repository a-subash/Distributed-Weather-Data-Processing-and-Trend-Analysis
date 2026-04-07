from fastapi import APIRouter

from ..services.forecast import predict_next_7

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.get("/{city_name}")
def predict_city(city_name: str):
    return predict_next_7(city_name)
