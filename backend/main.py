import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routes.weather import router as weather_router
from .routes.predictions import router as predictions_router
from .routes.settings import router as settings_router
from .kafka.producer import start_producer, get_throughput
from .kafka.consumer import start_consumer
from .spark.batch_job import run_batch_job

app = FastAPI(title="Distributed Weather Data Processing and Trend Analysis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router)
app.include_router(predictions_router)
app.include_router(settings_router)


@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.create_task(start_producer())
    loop.create_task(start_consumer())
    async def periodic_batch():
        while True:
            try:
                await asyncio.to_thread(run_batch_job)
            except Exception:
                pass
            await asyncio.sleep(60)
    loop.create_task(periodic_batch())


@app.get("/api/system")
def system_status():
    return {"status": "OPERATIONAL", "kafka_throughput": get_throughput()}
