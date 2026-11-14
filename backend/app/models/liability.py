from datetime import datetime, timezone
from typing import Any, Dict
from bson import ObjectId


def liability_helper(liability: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB liability document to client-safe response dict with string IDs."""
    if not liability:
        return {}

    return {
        "id": str(liability["_id"]),
        "user_id": str(liability["user_id"]),
        "name": liability.get("name", ""),
        "category": liability.get("category", "Other"),
        "value": float(liability.get("value", 0.0)),
        "created_at": liability.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": liability.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_liability_document(
    user_id: ObjectId,
    name: str,
    category: str,
    value: float,
) -> Dict[str, Any]:
    """Construct a new liability document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "name": name.strip(),
        "category": category.strip(),
        "value": max(0.0, float(value)),
        "created_at": now,
        "updated_at": now,
    }
