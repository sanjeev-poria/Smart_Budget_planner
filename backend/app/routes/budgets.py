from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetItemResponse,
    BudgetOverviewResponse,
    CopyBudgetRequest,
)
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["Budget Management"])


@router.get(
    "",
    response_model=BudgetOverviewResponse,
    summary="Get monthly budgets and spending adherence overview",
)
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Year (e.g. 2026)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns full budget overview for the specified month and year, including:
    - Budget limits, amounts spent, remaining balances, and percentage usages.
    - Status evaluation: Safe (<80%), Warning (80%-100%), Exceeded (>100%).
    - Unbudgeted categories that recorded expenses.
    Defaults to current UTC month and year if omitted.
    """
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    return budget_service.get_budget_overview(
        user_id=current_user["_id"],
        month=target_month,
        year=target_year,
    )


@router.post(
    "",
    response_model=BudgetItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update category budget for month/year",
)
def create_budget(
    payload: BudgetCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a budget for a category in a specific month and year.
    If a budget already exists for this category/month/year, its limit is updated.
    """
    return budget_service.create_budget(
        user_id=current_user["_id"],
        data=payload,
    )


@router.get(
    "/{budget_id}",
    response_model=BudgetItemResponse,
    summary="Get specific budget details with live spending",
)
def get_budget_by_id(
    budget_id: str,
    current_user: dict = Depends(get_current_user),
):
    return budget_service.get_budget_by_id(
        user_id=current_user["_id"],
        budget_id=budget_id,
    )


@router.put(
    "/{budget_id}",
    response_model=BudgetItemResponse,
    summary="Update budget limit or category",
)
def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    current_user: dict = Depends(get_current_user),
):
    return budget_service.update_budget(
        user_id=current_user["_id"],
        budget_id=budget_id,
        data=payload,
    )


@router.delete(
    "/{budget_id}",
    summary="Delete a budget",
)
def delete_budget(
    budget_id: str,
    current_user: dict = Depends(get_current_user),
):
    return budget_service.delete_budget(
        user_id=current_user["_id"],
        budget_id=budget_id,
    )


@router.post(
    "/copy-previous",
    summary="Copy budgets from prior month into target month",
)
def copy_previous_budgets(
    payload: CopyBudgetRequest,
    current_user: dict = Depends(get_current_user),
):
    return budget_service.copy_previous_month_budgets(
        user_id=current_user["_id"],
        req=payload,
    )
