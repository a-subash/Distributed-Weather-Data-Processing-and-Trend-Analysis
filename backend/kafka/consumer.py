import asyncio
from typing import Any, Dict

from .producer import get_queue
from ..services.processor import process_and_store
from ..services.anomaly import evaluate


async def start_consumer():
    q = None
    while q is None:
        q = get_queue()
        if q is None:
            await asyncio.sleep(0.5)
    batch = []
    while True:
        try:
            item = await q.get()
            batch.append(item)
            if len(batch) >= 8:
                res = process_and_store(batch)
                for e in batch:
                    evaluate(e)
                batch = []
        except Exception:
            batch = []
        await asyncio.sleep(0)
