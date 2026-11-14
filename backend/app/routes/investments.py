from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.deps import get_current_user
from app.database.mongodb import get_database
from app.schemas.investment import (
    InvestmentAssumptionsInput,
    InvestmentProjectionResponse,
    InvestmentAssumptionsResponse,
)
from app.services.calculations.investment_engine import calculate_investment_projection

router = APIRouter(prefix="/investments", tags=["Investment Planning & Projections"])


def _get_default_assumptions(current_user: Dict[str, Any]) -> Dict[str, Any]:
    """Derive sensible baseline defaults from authenticated user financial profile."""
    profile = current_user.get("financial_profile") or {}
    user_investment = float(profile.get("monthly_investment", 0.0))
    # If user hasn't set monthly investment in profile, default to ₹5,000
    monthly_inv = user_investment if user_investment > 0 else 5000.0

    return {
        "monthly_investment": monthly_inv,
        "annual_return_rate": 10.0,
        "investment_period": 10,
        "inflation_rate": 6.0,
        "initial_lumpsum": 0.0,
    }


@router.post(
    "/calculate",
    response_model=InvestmentProjectionResponse,
    summary="Compute Deterministic Investment Projection",
    description="Calculates compound growth trajectory, nominal future value, and real inflation-discounted purchasing power."
)
def compute_projection(
    params: InvestmentAssumptionsInput,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> InvestmentProjectionResponse:
    """Calculate future value and growth trajectory based on provided parameters."""
    res = calculate_investment_projection(
        monthly_investment=params.monthly_investment,
        annual_return_rate=params.annual_return_rate,
        investment_period=params.investment_period,
        inflation_rate=params.inflation_rate,
        initial_lumpsum=params.initial_lumpsum,
    )
    return InvestmentProjectionResponse(**res)


@router.get(
    "/assumptions",
    response_model=InvestmentAssumptionsResponse,
    summary="Get User's Saved Investment Assumptions",
    description="Retrieves persisted investment parameters or profile defaults from MongoDB."
)
def get_user_assumptions(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> InvestmentAssumptionsResponse:
    """Retrieve saved investment parameters for the authenticated user."""
    saved = current_user.get("investment_assumptions")
    if not saved:
        defaults = _get_default_assumptions(current_user)
        return InvestmentAssumptionsResponse(
            monthly_investment=defaults["monthly_investment"],
            annual_return_rate=defaults["annual_return_rate"],
            investment_period=defaults["investment_period"],
            inflation_rate=defaults["inflation_rate"],
            initial_lumpsum=defaults["initial_lumpsum"],
            updated_at=None,
        )

    return InvestmentAssumptionsResponse(
        monthly_investment=float(saved.get("monthly_investment", 500.0)),
        annual_return_rate=float(saved.get("annual_return_rate", 10.0)),
        investment_period=int(saved.get("investment_period", 10)),
        inflation_rate=float(saved.get("inflation_rate", 6.0)),
        initial_lumpsum=float(saved.get("initial_lumpsum", 0.0)),
        updated_at=saved.get("updated_at"),
    )


@router.put(
    "/assumptions",
    response_model=InvestmentAssumptionsResponse,
    summary="Save User's Investment Assumptions",
    description="Persists customized investment horizon, return rates, and monthly amounts to MongoDB."
)
def save_user_assumptions(
    assumptions_in: InvestmentAssumptionsInput,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> InvestmentAssumptionsResponse:
    """Save or update investment assumptions in the authenticated user document."""
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()

    assumptions_data = {
        "monthly_investment": float(assumptions_in.monthly_investment),
        "annual_return_rate": float(assumptions_in.annual_return_rate),
        "investment_period": int(assumptions_in.investment_period),
        "inflation_rate": float(assumptions_in.inflation_rate),
        "initial_lumpsum": float(assumptions_in.initial_lumpsum),
        "updated_at": now,
    }

    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"investment_assumptions": assumptions_data}},
    )

    return InvestmentAssumptionsResponse(**assumptions_data)


@router.get(
    "/projection",
    response_model=InvestmentProjectionResponse,
    summary="Get Consolidated Projection for Saved Assumptions",
    description="Calculates full projection curve directly from user's saved assumptions in a single call."
)
def get_saved_projection(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> InvestmentProjectionResponse:
    """Calculate projection directly using current saved assumptions."""
    saved = current_user.get("investment_assumptions")
    if not saved:
        saved = _get_default_assumptions(current_user)

    res = calculate_investment_projection(
        monthly_investment=float(saved.get("monthly_investment", 500.0)),
        annual_return_rate=float(saved.get("annual_return_rate", 10.0)),
        investment_period=int(saved.get("investment_period", 10)),
        inflation_rate=float(saved.get("inflation_rate", 6.0)),
        initial_lumpsum=float(saved.get("initial_lumpsum", 0.0)),
    )
    return InvestmentProjectionResponse(**res)
