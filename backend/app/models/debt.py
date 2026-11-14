from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def debt_helper(debt: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB debt document to client-safe response dict with string IDs."""
    if not debt:
        return {}

    return {
        "id": str(debt["_id"]),
        "user_id": str(debt["user_id"]),
        "debt_name": debt.get("debt_name", ""),
        "principal": float(debt.get("principal", 0.0)),
        "remaining_balance": float(debt.get("remaining_balance", 0.0)),
        "interest_rate": float(debt.get("interest_rate", 0.0)),
        "minimum_payment": float(debt.get("minimum_payment", 0.0)),
        "due_date": str(debt.get("due_date", "")),
        "category": debt.get("category", "Credit Card"),
        "created_at": debt.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": debt.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_debt_document(
    user_id: ObjectId,
    debt_name: str,
    principal: float,
    remaining_balance: float,
    interest_rate: float,
    minimum_payment: float,
    due_date: str,
    category: str = "Credit Card",
) -> Dict[str, Any]:
    """Construct a new debt document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "debt_name": debt_name.strip(),
        "principal": float(principal),
        "remaining_balance": float(remaining_balance),
        "interest_rate": float(interest_rate),
        "minimum_payment": float(minimum_payment),
        "due_date": due_date.strip(),
        "category": category.strip(),
        "created_at": now,
        "updated_at": now,
    }
