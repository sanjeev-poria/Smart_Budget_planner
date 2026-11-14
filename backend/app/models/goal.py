from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def goal_helper(goal: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB goal document to dictionary with string IDs."""
    if not goal:
        return {}

    return {
        "id": str(goal["_id"]),
        "user_id": str(goal["user_id"]),
        "goal_name": goal.get("goal_name", ""),
        "target_amount": float(goal.get("target_amount", 0.0)),
        "current_saved": float(goal.get("current_saved", 0.0)),
        "target_date": goal.get("target_date", ""),
        "category": goal.get("category", "Other"),
        "description": goal.get("description", ""),
        "created_at": goal.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": goal.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_goal_document(
    user_id: ObjectId,
    goal_name: str,
    target_amount: float,
    current_saved: float,
    target_date: str,
    category: str = "Other",
    description: str = "",
) -> Dict[str, Any]:
    """Construct a new goal document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "goal_name": goal_name.strip(),
        "target_amount": float(target_amount),
        "current_saved": float(current_saved),
        "target_date": target_date.strip(),
        "category": category.strip(),
        "description": description.strip() if description else "",
        "created_at": now,
        "updated_at": now,
    }
