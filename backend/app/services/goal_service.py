import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.goal import goal_helper, create_goal_document
from app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalSummary,
    GoalListResponse,
)


def compute_goal_metrics(
    goal_dict: Dict[str, Any],
    monthly_surplus: float,
    reference_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Deterministic pure Python calculation of goal tracking metrics:
    - progress_percentage (0–100%)
    - amount_remaining
    - months_remaining
    - monthly_required
    - on_track
    - status ('completed', 'on_track', 'off_track', 'overdue')
    """
    target_amount = float(goal_dict.get("target_amount", 0.0))
    current_saved = float(goal_dict.get("current_saved", 0.0))
    target_date_str = str(goal_dict.get("target_date", "")).strip()

    # Edge Case: target_amount <= 0
    if target_amount <= 0.0:
        return {
            **goal_dict,
            "progress_percentage": 100.0,
            "amount_remaining": 0.0,
            "months_remaining": 0,
            "monthly_required": 0.0,
            "on_track": True,
            "status": "completed",
            "user_monthly_surplus": round(monthly_surplus, 2),
        }

    # Standard / overfunded calculation
    remaining = max(0.0, round(target_amount - current_saved, 2))
    progress = min(100.0, round((current_saved / target_amount) * 100.0, 1))

    # Calculate months remaining
    today = reference_date or date.today()
    try:
        target_dt = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        target_dt = today

    days_diff = (target_dt - today).days

    if days_diff < 0:
        months_remaining = 0
    elif days_diff == 0:
        months_remaining = 0
    else:
        # Standard average days per month: 30.4375
        months_remaining = max(1, int(math.ceil(days_diff / 30.4375)))

    # Calculate monthly required
    if remaining <= 0.0:
        monthly_required = 0.0
    elif months_remaining <= 0:
        monthly_required = remaining
    else:
        monthly_required = round(remaining / months_remaining, 2)

    # Determine status & on_track
    if remaining <= 0.0:
        status = "completed"
        on_track = True
    elif months_remaining <= 0:
        status = "overdue"
        on_track = monthly_surplus >= monthly_required
    elif monthly_surplus >= monthly_required:
        status = "on_track"
        on_track = True
    else:
        status = "off_track"
        on_track = False

    return {
        **goal_dict,
        "progress_percentage": progress,
        "amount_remaining": remaining,
        "months_remaining": months_remaining,
        "monthly_required": monthly_required,
        "on_track": on_track,
        "status": status,
        "user_monthly_surplus": round(monthly_surplus, 2),
    }


def create_goal(
    user_id: ObjectId,
    goal_in: GoalCreate,
    monthly_surplus: float,
) -> GoalResponse:
    """Create a new financial goal document in MongoDB."""
    db = get_database()
    doc = create_goal_document(
        user_id=user_id,
        goal_name=goal_in.goal_name,
        target_amount=goal_in.target_amount,
        current_saved=goal_in.current_saved,
        target_date=goal_in.target_date,
        category=goal_in.category,
        description=goal_in.description or "",
    )
    result = db.goals.insert_one(doc)
    doc["_id"] = result.inserted_id

    helper_dict = goal_helper(doc)
    computed = compute_goal_metrics(helper_dict, monthly_surplus=monthly_surplus)
    return GoalResponse(**computed)


def get_goals(
    user_id: ObjectId,
    monthly_surplus: float,
    reference_date: Optional[date] = None,
) -> GoalListResponse:
    """Retrieve all goals for a user with computed progress and aggregate metrics."""
    db = get_database()
    cursor = db.goals.find({"user_id": user_id}).sort("target_date", 1)

    items: List[GoalResponse] = []
    total_target = 0.0
    total_saved = 0.0
    completed_count = 0
    on_track_count = 0
    off_track_count = 0

    for doc in cursor:
        helper_dict = goal_helper(doc)
        computed = compute_goal_metrics(
            helper_dict,
            monthly_surplus=monthly_surplus,
            reference_date=reference_date,
        )
        resp = GoalResponse(**computed)
        items.append(resp)

        total_target += resp.target_amount
        total_saved += min(resp.target_amount, resp.current_saved)

        if resp.status == "completed":
            completed_count += 1
        elif resp.status == "on_track":
            on_track_count += 1
        else:
            off_track_count += 1

    overall_progress = (
        round((total_saved / total_target) * 100.0, 1)
        if total_target > 0.0
        else 0.0
    )

    summary = GoalSummary(
        total_goals=len(items),
        completed_goals=completed_count,
        on_track_goals=on_track_count,
        off_track_goals=off_track_count,
        total_target_amount=round(total_target, 2),
        total_current_saved=round(total_saved, 2),
        overall_progress=min(100.0, overall_progress),
    )

    return GoalListResponse(items=items, summary=summary)


def get_goal_by_id(
    goal_id: str,
    user_id: ObjectId,
    monthly_surplus: float,
) -> Optional[GoalResponse]:
    """Retrieve a single goal ensuring user ownership."""
    if not ObjectId.is_valid(goal_id):
        return None

    db = get_database()
    doc = db.goals.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
    if not doc:
        return None

    helper_dict = goal_helper(doc)
    computed = compute_goal_metrics(helper_dict, monthly_surplus=monthly_surplus)
    return GoalResponse(**computed)


def update_goal(
    goal_id: str,
    user_id: ObjectId,
    goal_in: GoalUpdate,
    monthly_surplus: float,
) -> Optional[GoalResponse]:
    """Update goal fields with strict user isolation."""
    if not ObjectId.is_valid(goal_id):
        return None

    db = get_database()
    existing = db.goals.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
    if not existing:
        return None

    update_data: Dict[str, Any] = {}
    if goal_in.goal_name is not None:
        update_data["goal_name"] = goal_in.goal_name.strip()
    if goal_in.target_amount is not None:
        update_data["target_amount"] = float(goal_in.target_amount)
    if goal_in.current_saved is not None:
        update_data["current_saved"] = float(goal_in.current_saved)
    if goal_in.target_date is not None:
        update_data["target_date"] = goal_in.target_date.strip()
    if goal_in.category is not None:
        update_data["category"] = goal_in.category.strip()
    if goal_in.description is not None:
        update_data["description"] = goal_in.description.strip()

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.goals.update_one(
        {"_id": ObjectId(goal_id), "user_id": user_id},
        {"$set": update_data},
    )

    updated_doc = db.goals.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
    helper_dict = goal_helper(updated_doc)
    computed = compute_goal_metrics(helper_dict, monthly_surplus=monthly_surplus)
    return GoalResponse(**computed)


def delete_goal(goal_id: str, user_id: ObjectId) -> bool:
    """Delete a goal document ensuring user ownership."""
    if not ObjectId.is_valid(goal_id):
        return False

    db = get_database()
    res = db.goals.delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
    return res.deleted_count > 0
