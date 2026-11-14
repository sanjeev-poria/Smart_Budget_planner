from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user
from app.schemas.tax import (
    TaxInvestmentCreate,
    TaxInvestmentUpdate,
    TaxInvestmentResponse,
    TaxOverviewResponse,
    TaxRegimeComparison,
    TaxCompareRequest,
)
from app.services import tax_service

router = APIRouter(prefix="/tax", tags=["Tax Savings Center"])


@router.get(
    "/config",
    response_model=Dict[str, Any],
    summary="Get centralized tax rules, section limits, categories, and disclaimers",
)
def get_tax_config():
    """
    Returns backend-configured tax rules (80C, 80CCD, 80D limits,
    standard deductions, supported categories, and legal disclaimers).
    Guarantees no hardcoded tax rules in the frontend.
    """
    return tax_service.get_tax_rules_config()


@router.get(
    "/overview",
    response_model=TaxOverviewResponse,
    summary="Get Section 80C summary, deductions, and New vs Old regime comparison",
)
def get_tax_overview(
    financial_year: Optional[str] = Query("2025-26", description="e.g. 2025-26"),
    gross_income: Optional[float] = Query(None, gt=0, description="Optional custom annual income to simulate"),
    current_user: dict = Depends(get_current_user),
):
    """
    Consolidates user's tax-saving investments, calculates 80C headroom (max ₹1.5L),
    other deductions, and deterministically compares tax liability under New vs Old regimes.
    """
    return tax_service.get_tax_overview(
        user_id=current_user["_id"],
        financial_year=financial_year or "2025-26",
        custom_gross_income=gross_income,
    )


@router.get(
    "/investments",
    response_model=List[TaxInvestmentResponse],
    summary="List all tax investments for a financial year",
)
def list_tax_investments(
    financial_year: Optional[str] = Query("2025-26"),
    current_user: dict = Depends(get_current_user),
):
    return tax_service.get_tax_investments(
        user_id=current_user["_id"],
        financial_year=financial_year or "2025-26",
    )


@router.post(
    "/investments",
    response_model=TaxInvestmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new tax-saving investment (PPF, ELSS, LIC, NSC, EPF, etc.)",
)
def create_tax_investment(
    payload: TaxInvestmentCreate,
    current_user: dict = Depends(get_current_user),
):
    return tax_service.create_tax_investment(
        user_id=current_user["_id"],
        data=payload,
    )


@router.get(
    "/investments/{item_id}",
    response_model=TaxInvestmentResponse,
    summary="Get single tax investment details",
)
def get_tax_investment_by_id(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    return tax_service.get_tax_investment_by_id(
        user_id=current_user["_id"],
        item_id=item_id,
    )


@router.put(
    "/investments/{item_id}",
    response_model=TaxInvestmentResponse,
    summary="Update an existing tax investment record",
)
def update_tax_investment(
    item_id: str,
    payload: TaxInvestmentUpdate,
    current_user: dict = Depends(get_current_user),
):
    return tax_service.update_tax_investment(
        user_id=current_user["_id"],
        item_id=item_id,
        data=payload,
    )


@router.delete(
    "/investments/{item_id}",
    summary="Delete a tax investment record",
)
def delete_tax_investment(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    return tax_service.delete_tax_investment(
        user_id=current_user["_id"],
        item_id=item_id,
    )


@router.post(
    "/compare",
    response_model=TaxRegimeComparison,
    summary="Simulate New vs Old regime for custom gross annual income",
)
def compare_tax_regimes_scenario(
    payload: TaxCompareRequest,
    current_user: dict = Depends(get_current_user),
):
    return tax_service.simulate_regime_comparison(
        user_id=current_user["_id"],
        annual_gross_income=payload.annual_gross_income,
        financial_year=payload.financial_year or "2025-26",
    )
