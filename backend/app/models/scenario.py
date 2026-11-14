from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def scenario_helper(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB scenario document to client-safe response dict."""
    if not scenario:
        return {}

    return {
        "id": str(scenario.get("_id")),
        "user_id": str(scenario.get("user_id")),
        "scenario_name": scenario.get("scenario_name", "Untitled Scenario"),
        "description": scenario.get("description") or "",
        "inputs": scenario.get("inputs", {}),
        "created_at": scenario.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": scenario.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_scenario_document(
    user_id: ObjectId,
    scenario_name: str,
    description: Optional[str],
    inputs: Dict[str, Any],
) -> Dict[str, Any]:
    """Construct a new scenario document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "scenario_name": scenario_name.strip(),
        "description": (description or "").strip(),
        "inputs": inputs or {},
        "created_at": now,
        "updated_at": now,
    }
