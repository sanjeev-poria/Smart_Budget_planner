from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def budget_helper(budget: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB budget document to client-safe response dict."""
    if not budget:
        return {}

    return {
        "id": str(budget.get("_id")),
        "user_id": str(budget.get("user_id")),
        "category": budget.get("category", "Other"),
        "monthly_limit": float(budget.get("monthly_limit", 0.0)),
        "month": int(budget.get("month", 1)),
        "year": int(budget.get("year", 2026)),
        "created_at": budget.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": budget.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_budget_document(
    user_id: ObjectId,
    category: str,
    monthly_limit: float,
    month: int,
    year: int,
) -> Dict[str, Any]:
    """Construct a new budget document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "category": category.strip(),
        "monthly_limit": round(float(monthly_limit), 2),
        "month": int(month),
        "year": int(year),
        "created_at": now,
        "updated_at": now,
    }
