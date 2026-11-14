from datetime import datetime, timezone
from typing import Any, Dict
from bson import ObjectId


def asset_helper(asset: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB asset document to client-safe response dict with string IDs."""
    if not asset:
        return {}

    return {
        "id": str(asset["_id"]),
        "user_id": str(asset["user_id"]),
        "name": asset.get("name", ""),
        "category": asset.get("category", "Other"),
        "value": float(asset.get("value", 0.0)),
        "created_at": asset.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": asset.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_asset_document(
    user_id: ObjectId,
    name: str,
    category: str,
    value: float,
) -> Dict[str, Any]:
    """Construct a new asset document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "name": name.strip(),
        "category": category.strip(),
        "value": max(0.0, float(value)),
        "created_at": now,
        "updated_at": now,
    }
