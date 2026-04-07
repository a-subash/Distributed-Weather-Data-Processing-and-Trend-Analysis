import asyncio
import time
from typing import Any, Dict, Optional

from ..services.fetcher import fetch_all_live
from ..config import CITIES

queue: Optional[asyncio.Queue] = None
_throughput = 0.0


async def start_producer():
    global queue, _throughput
    if queue is None:
        queue = asyncio.Queue(maxsize=1000)
    while True:
        t0 = time.time()
        data = await fetch_all_live(CITIES)
        for item in data:
            await queue.put(item)
        dt = max(0.001, time.time() - t0)
        _throughput = len(data) / dt
        await asyncio.sleep(2)


def get_throughput() -> float:
    return float(_throughput)


def get_queue() -> Optional[asyncio.Queue]:
    return queue
