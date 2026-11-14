from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def transaction_helper(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB transaction document to client-safe response dict."""
    if not transaction:
        return {}

    return {
        "id": str(transaction.get("_id")),
        "user_id": str(transaction.get("user_id")),
        "amount": float(transaction.get("amount", 0.0)),
        "type": transaction.get("type", "expense"),
        "category": transaction.get("category", "Other"),
        "date": transaction.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "description": transaction.get("description", ""),
        "created_at": transaction.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": transaction.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_transaction_document(
    user_id: ObjectId,
    amount: float,
    type_: str,
    category: str,
    date: str,
    description: str,
) -> Dict[str, Any]:
    """Construct a new transaction document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "amount": round(float(amount), 2),
        "type": type_.strip().lower(),
        "category": category.strip(),
        "date": date.strip(),
        "description": description.strip(),
        "created_at": now,
        "updated_at": now,
    }
