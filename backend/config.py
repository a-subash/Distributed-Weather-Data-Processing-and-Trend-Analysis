import os

_OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "weather_bigdata"
CITIES = ["Hyderabad", "Mumbai", "Delhi", "New York", "London", "Tokyo", "Sydney", "Dubai"]
KAFKA_TOPIC = "weather-stream"
CORS_ORIGINS = ["http://localhost:5173"]

def get_api_key() -> str:
    return _OPENWEATHER_API_KEY

def set_api_key(value: str) -> None:
    global _OPENWEATHER_API_KEY
    _OPENWEATHER_API_KEY = value or ""
