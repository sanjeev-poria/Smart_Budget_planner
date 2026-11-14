from datetime import datetime, timezone
from typing import Any, Dict, List
from bson import ObjectId


def score_history_helper(record: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB score_history document to client-safe response dict."""
    if not record:
        return {}

    return {
        "id": str(record.get("_id")),
        "user_id": str(record.get("user_id")),
        "score": int(record.get("score", 0)),
        "risk_level": record.get("risk_level", "Medium Risk / Good"),
        "surplus": float(record.get("surplus", 0.0)),
        "savings_rate": float(record.get("savings_rate", 0.0)),
        "date": record.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "recorded_at": record.get("recorded_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_score_history_document(
    user_id: ObjectId,
    score: int,
    risk_level: str,
    surplus: float,
    savings_rate: float,
) -> Dict[str, Any]:
    """Construct a score_history document."""
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "score": int(score),
        "risk_level": risk_level,
        "surplus": round(float(surplus), 2),
        "savings_rate": round(float(savings_rate), 2),
        "date": now.strftime("%Y-%m-%d"),
        "recorded_at": now.isoformat(),
    }
