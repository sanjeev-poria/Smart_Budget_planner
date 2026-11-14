from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.deps import get_current_user
from app.schemas.debt import (
    DebtCreate,
    DebtUpdate,
    DebtResponse,
    DebtListResponse,
    DebtRepaymentPlanRequest,
    DebtRepaymentPlanResponse,
)
from app.services.debt_service import (
    create_debt,
    get_debts,
    get_debt_by_id,
    update_debt,
    delete_debt,
    generate_user_repayment_plan,
)

router = APIRouter(prefix="/debts", tags=["Debt Management & Repayment Planning"])


@router.post(
    "",
    response_model=DebtResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a New Debt Liability",
    description="Records an outstanding debt liability with principal, interest rate, and minimum payment."
)
def create_new_debt(
    debt_in: DebtCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DebtResponse:
    """Create a new debt for the authenticated user."""
    return create_debt(user_id=current_user["_id"], debt_in=debt_in)


@router.get(
    "",
    response_model=DebtListResponse,
    summary="List All User Debts",
    description="Retrieves all active liabilities with weighted interest rates and aggregate totals."
)
def list_user_debts(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DebtListResponse:
    """List all debts for the authenticated user."""
    return get_debts(user_id=current_user["_id"])


@router.get(
    "/{debt_id}",
    response_model=DebtResponse,
    summary="Get Single Debt Details",
    description="Retrieves a specific debt by ID verifying user ownership."
)
def get_single_debt(
    debt_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DebtResponse:
    """Retrieve single debt by ID."""
    debt = get_debt_by_id(debt_id=debt_id, user_id=current_user["_id"])
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt record not found or unauthorized",
        )
    return debt


@router.put(
    "/{debt_id}",
    response_model=DebtResponse,
    summary="Update Debt Details",
    description="Updates balance, interest rate, or payments for a liability."
)
def modify_debt(
    debt_id: str,
    debt_in: DebtUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DebtResponse:
    """Update existing debt record."""
    updated = update_debt(debt_id=debt_id, user_id=current_user["_id"], debt_in=debt_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt record not found or unauthorized",
        )
    return updated


@router.delete(
    "/{debt_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Debt Record",
    description="Deletes a debt liability belonging to the authenticated user."
)
def remove_debt(
    debt_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    """Delete debt by ID."""
    success = delete_debt(debt_id=debt_id, user_id=current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt record not found or unauthorized",
        )
    return {"message": "Debt deleted successfully", "id": debt_id}


@router.post(
    "/plan",
    response_model=DebtRepaymentPlanResponse,
    summary="Generate Payoff Plan (Avalanche vs Snowball)",
    description="Simulates month-by-month payoff schedule, total interest paid, debt-free date, and strategy comparison."
)
def get_repayment_plan(
    request: DebtRepaymentPlanRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DebtRepaymentPlanResponse:
    """Calculate deterministic payoff plan across active debts."""
    return generate_user_repayment_plan(user_id=current_user["_id"], request=request)
