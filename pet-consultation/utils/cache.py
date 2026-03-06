import hashlib
import json
import time
from typing import Optional, Any
from config.settings import CACHE_TTL


class ResponseCache:
    def __init__(self, ttl: int = CACHE_TTL):
        self._store: dict = {}
        self._ttl = ttl

    def _make_key(self, data: dict) -> str:
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(serialized.encode()).hexdigest()

    def get(self, key_data: dict) -> Optional[Any]:
        key = self._make_key(key_data)
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key_data: dict, value: Any) -> None:
        key = self._make_key(key_data)
        self._store[key] = (value, time.time() + self._ttl)

    def clear_expired(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]


# Singleton
response_cache = ResponseCache()
