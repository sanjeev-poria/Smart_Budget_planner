from datetime import datetime, timezone
import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database.mongodb import get_database
from app.models.user import user_helper
from app.schemas.user import UserProfileUpdate, UserResponse

logger = logging.getLogger("smartfin.users")
router = APIRouter(prefix="/users", tags=["User Profile"])


@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update user personal and financial profile",
    description="Updates authenticated user's demographic info and deterministic financial metrics (income, expenses, savings, EMI, investments, taxes)."
)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> UserResponse:
    """Update profile and financial parameters."""
    db = get_database()
    user_id = current_user["_id"]

    update_fields: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    # Demographics
    if profile_in.name is not None:
        update_fields["name"] = profile_in.name.strip()
    if profile_in.age is not None:
        update_fields["age"] = profile_in.age
    if profile_in.city is not None:
        update_fields["city"] = profile_in.city.strip()

    # Financial Profile
    existing_financial = current_user.get("financial_profile") or {}
    financial_updates = {}

    financial_keys = [
        "monthly_income",
        "monthly_expenses",
        "current_savings",
        "monthly_emi",
        "monthly_investment",
        "tax_regime",
        "tax_deductions_80c",
        "other_tax_deductions",
        "notes",
    ]

    for key in financial_keys:
        val = getattr(profile_in, key, None)
        if val is not None:
            financial_updates[f"financial_profile.{key}"] = val

    update_fields.update(financial_updates)

    db.users.update_one({"_id": user_id}, {"$set": update_fields})

    updated_user = db.users.find_one({"_id": user_id})
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found after update",
        )

    logger.info("Updated profile for user: %s", current_user.get("email"))
    return UserResponse(**user_helper(updated_user))
