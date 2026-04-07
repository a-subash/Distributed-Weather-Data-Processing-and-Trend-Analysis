import os
import time
from typing import Any, Dict, List, Optional

from . import mongo as _self  # circular-safe for in-memory store

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except Exception:
    MongoClient = None  # type: ignore
    PyMongoError = Exception  # type: ignore

from ..config import MONGODB_URI, DATABASE_NAME


class InMemoryDB:
    def __init__(self) -> None:
        self.storage: Dict[str, List[Dict[str, Any]]] = {}
        self.analytics: Dict[str, Any] = {}
        self.anomalies: List[Dict[str, Any]] = []

    def insert_record(self, collection: str, record: Dict[str, Any]) -> None:
        self.storage.setdefault(collection, []).append(record)

    def insert_many(self, collection: str, records: List[Dict[str, Any]]) -> None:
        self.storage.setdefault(collection, []).extend(records)

    def get_recent_data(self, collection: str, city: Optional[str], limit: int) -> List[Dict[str, Any]]:
        data = self.storage.get(collection, [])
        if city:
            data = [d for d in data if d.get("city") == city]
        return sorted(data, key=lambda x: x.get("timestamp", 0), reverse=True)[:limit]

    def get_history_days(self, collection: str, days: int) -> List[Dict[str, Any]]:
        min_ts = time.time() - days * 86400
        data = self.storage.get(collection, [])
        return [d for d in data if d.get("timestamp", 0) >= min_ts]

    def get_last_record(self, collection: str, city: str) -> Optional[Dict[str, Any]]:
        recs = self.get_recent_data(collection, city, 1)
        return recs[0] if recs else None

    def save_analytics(self, key: str, value: Any) -> None:
        self.analytics[key] = value

    def get_analytics(self, key: str) -> Any:
        return self.analytics.get(key)

    def add_anomaly(self, anomaly: Dict[str, Any]) -> None:
        self.anomalies.insert(0, anomaly)
        self.anomalies = self.anomalies[:200]

    def get_anomalies(self) -> List[Dict[str, Any]]:
        return self.anomalies[:]


_in_memory = InMemoryDB()
_mongo_client = None
_mongo_db = None


def _connect():
    global _mongo_client, _mongo_db
    if MongoClient is None:
        return False
    try:
        _mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
        _mongo_client.server_info()
        _mongo_db = _mongo_client[DATABASE_NAME]
        return True
    except Exception:
        _mongo_client = None
        _mongo_db = None
        return False


def get_db():
    if _mongo_db is None:
        connected = _connect()
        if not connected:
            return _in_memory
    return _mongo_db if _mongo_db is not None else _in_memory


def insert_record(collection: str, record: Dict[str, Any]) -> None:
    db = get_db()
    if isinstance(db, InMemoryDB):
        db.insert_record(collection, record)
        return
    try:
        db[collection].insert_one(record)
    except Exception:
        _in_memory.insert_record(collection, record)


def insert_many(collection: str, records: List[Dict[str, Any]]) -> None:
    db = get_db()
    if isinstance(db, InMemoryDB):
        db.insert_many(collection, records)
        return
    try:
        if records:
            db[collection].insert_many(records)
    except Exception:
        _in_memory.insert_many(collection, records)


def get_recent_data(collection: str, city: Optional[str], limit: int) -> List[Dict[str, Any]]:
    db = get_db()
    if isinstance(db, InMemoryDB):
        return db.get_recent_data(collection, city, limit)
    q = {}
    if city:
        q["city"] = city
    try:
        cur = db[collection].find(q).sort("timestamp", -1).limit(limit)
        return list(cur)
    except Exception:
        return _in_memory.get_recent_data(collection, city, limit)


def get_history_days(collection: str, days: int) -> List[Dict[str, Any]]:
    db = get_db()
    if isinstance(db, InMemoryDB):
        return db.get_history_days(collection, days)
    min_ts = time.time() - days * 86400
    try:
        cur = db[collection].find({"timestamp": {"$gte": min_ts}})
        return list(cur)
    except Exception:
        return _in_memory.get_history_days(collection, days)


def get_last_record(collection: str, city: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    if isinstance(db, InMemoryDB):
        return db.get_last_record(collection, city)
    try:
        cur = db[collection].find({"city": city}).sort("timestamp", -1).limit(1)
        recs = list(cur)
        return recs[0] if recs else None
    except Exception:
        return _in_memory.get_last_record(collection, city)


def save_analytics(key: str, value: Any) -> None:
    db = get_db()
    if isinstance(db, InMemoryDB):
        db.save_analytics(key, value)
        return
    try:
        db["analytics"].update_one({"key": key}, {"$set": {"key": key, "value": value}}, upsert=True)
    except Exception:
        _in_memory.save_analytics(key, value)


def get_analytics(key: str) -> Any:
    db = get_db()
    if isinstance(db, InMemoryDB):
        return db.get_analytics(key)
    try:
        doc = db["analytics"].find_one({"key": key})
        return None if doc is None else doc.get("value")
    except Exception:
        return _in_memory.get_analytics(key)


def add_anomaly(anomaly: Dict[str, Any]) -> None:
    _in_memory.add_anomaly(anomaly)
    db = get_db()
    if isinstance(db, InMemoryDB):
        return
    try:
        db["anomalies"].insert_one(anomaly)
    except Exception:
        pass


def get_anomalies(limit: int = 50) -> List[Dict[str, Any]]:
    db = get_db()
    if isinstance(db, InMemoryDB):
        return db.get_anomalies()[:limit]
    try:
        cur = db["anomalies"].find({}).sort("timestamp", -1).limit(limit)
        return list(cur)
    except Exception:
        return _in_memory.get_anomalies()[:limit]
