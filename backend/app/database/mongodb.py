import logging
import time
from typing import Any, Dict, Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

import mongomock

from app.core.config import settings

logger = logging.getLogger("smartfin.database")


class MongoDBManager:
    client: Optional[Any] = None
    db: Optional[Database] = None
    is_mock: bool = False

    def connect(self) -> None:
        """Initialize MongoDB Client with timeout and fallback support."""
        try:
            masked_url = settings.MONGODB_URL.split("@")[-1] if "@" in settings.MONGODB_URL else settings.MONGODB_URL
            logger.info("Connecting to MongoDB at %s...", masked_url)
            real_client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
                connectTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
                appname="SMARTFIN",
            )
            # Test ping
            real_client.admin.command("ping")
            self.client = real_client
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_mock = False
            self._ensure_indexes()
            logger.info("Successfully connected to live MongoDB database '%s'.", settings.MONGODB_DB_NAME)
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            logger.warning(
                "Live MongoDB not reachable at %s (%s). "
                "Engaging PyMongo in-memory driver (mongomock) for seamless local execution. "
                "To connect cloud database, set MONGODB_URL in backend/.env.",
                settings.MONGODB_URL,
                exc,
            )
            self.client = mongomock.MongoClient()
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_mock = True
            self._ensure_indexes()
            logger.info("In-memory PyMongo initialized for '%s'.", settings.MONGODB_DB_NAME)

    def _ensure_indexes(self) -> None:
        """Ensure indexes like unique email on users collection."""
        if self.db is not None:
            try:
                self.db.users.create_index("email", unique=True)
            except Exception as e:
                logger.warning("Could not ensure indexes: %s", e)

    def close(self) -> None:
        """Close MongoDB connection gracefully."""
        if self.client:
            logger.info("Closing MongoDB connection.")
            try:
                self.client.close()
            except Exception:
                pass
            self.client = None
            self.db = None

    def get_database(self) -> Database:
        """Return the active database instance."""
        if self.db is None:
            self.connect()
        return self.db

    def ping(self) -> Dict[str, Any]:
        """Ping MongoDB and measure response latency."""
        if self.db is None or self.client is None:
            self.connect()

        if self.is_mock:
            return {
                "connected": True,
                "database_name": settings.MONGODB_DB_NAME,
                "latency_ms": 0.4,
                "error": None,
                "mode": "in-memory (PyMongo compatible)",
            }

        start_time = time.perf_counter()
        try:
            self.client.admin.command("ping")
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "connected": True,
                "database_name": settings.MONGODB_DB_NAME,
                "latency_ms": latency_ms,
                "error": None,
                "mode": "live (MongoDB / Atlas)",
            }
        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            return {
                "connected": False,
                "database_name": settings.MONGODB_DB_NAME,
                "latency_ms": None,
                "error": f"Connection timed out or refused: {exc}",
                "mode": "offline",
            }
        except Exception as exc:
            return {
                "connected": False,
                "database_name": settings.MONGODB_DB_NAME,
                "latency_ms": None,
                "error": str(exc),
                "mode": "offline",
            }


db_manager = MongoDBManager()


def connect_to_mongo() -> None:
    db_manager.connect()


def close_mongo_connection() -> None:
    db_manager.close()


def get_database() -> Database:
    return db_manager.get_database()


def ping_database() -> Dict[str, Any]:
    return db_manager.ping()
