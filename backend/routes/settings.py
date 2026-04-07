from fastapi import APIRouter
from pydantic import BaseModel
from ..config import get_api_key, set_api_key

router = APIRouter(prefix="/api/config", tags=["config"])

class KeyPayload(BaseModel):
    api_key: str

@router.get("")
def get_config():
    k = get_api_key()
    return {"has_key": bool(k)}

@router.post("/api-key")
def update_key(payload: KeyPayload):
    set_api_key(payload.api_key or "")
    return {"ok": True, "has_key": bool(get_api_key())}
