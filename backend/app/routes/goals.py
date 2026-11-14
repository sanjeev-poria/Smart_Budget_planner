from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.deps import get_current_user
from app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalListResponse,
)
from app.services.goal_service import (
    create_goal,
    get_goals,
    get_goal_by_id,
    update_goal,
    delete_goal,
)

router = APIRouter(prefix="/goals", tags=["Financial Goals & Milestones"])


def _extract_surplus(user: Dict[str, Any]) -> float:
    """Calculate user's monthly cashflow surplus from baseline profile."""
    profile = user.get("financial_profile") or {}
    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    return round(income - expenses, 2)


@router.post(
    "",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a New Financial Goal",
    description="Creates a financial milestone target and computes initial monthly required and on-track metrics."
)
def create_new_goal(
    goal_in: GoalCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> GoalResponse:
    """Create a new goal for the authenticated user."""
    surplus = _extract_surplus(current_user)
    return create_goal(
        user_id=current_user["_id"],
        goal_in=goal_in,
        monthly_surplus=surplus,
    )


@router.get(
    "",
    response_model=GoalListResponse,
    summary="List User Goals & Progress Summary",
    description="Returns all financial goals for the authenticated user with deterministic on-track evaluations."
)
def list_goals(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> GoalListResponse:
    """Retrieve all user goals with aggregate progress summary."""
    surplus = _extract_surplus(current_user)
    return get_goals(user_id=current_user["_id"], monthly_surplus=surplus)


@router.get(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Get Single Goal Details",
    description="Retrieves a specific goal with computed metrics ensuring user ownership."
)
def get_single_goal(
    goal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> GoalResponse:
    """Retrieve a single goal by ID."""
    surplus = _extract_surplus(current_user)
    goal = get_goal_by_id(
        goal_id=goal_id,
        user_id=current_user["_id"],
        monthly_surplus=surplus,
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found or unauthorized access",
        )
    return goal


@router.put(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Update Goal Details or Progress",
    description="Updates goal parameters (target amount, current saved, target date) and re-evaluates on-track metrics."
)
def modify_goal(
    goal_id: str,
    goal_in: GoalUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> GoalResponse:
    """Update an existing goal."""
    surplus = _extract_surplus(current_user)
    updated = update_goal(
        goal_id=goal_id,
        user_id=current_user["_id"],
        goal_in=goal_in,
        monthly_surplus=surplus,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found or unauthorized access",
        )
    return updated


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Financial Goal",
    description="Deletes a goal belonging to the authenticated user."
)
def remove_goal(
    goal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    """Delete a goal by ID."""
    success = delete_goal(goal_id=goal_id, user_id=current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found or unauthorized access",
        )
    return {"message": "Goal deleted successfully", "id": goal_id}
