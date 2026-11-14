from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.tax_config import (
    SUPPORTED_TAX_CATEGORIES,
    SECTION_80C_MAX_LIMIT,
    SECTION_80CCD_1B_MAX_LIMIT,
    SECTION_80D_SELF_LIMIT,
    SECTION_80D_PARENTS_SENIOR_LIMIT,
    STANDARD_DEDUCTION_NEW_REGIME,
    STANDARD_DEDUCTION_OLD_REGIME,
    TAX_DISCLAIMER,
)
from app.database.mongodb import get_database
from app.models.tax import tax_investment_helper, create_tax_investment_document
from app.schemas.tax import (
    TaxInvestmentCreate,
    TaxInvestmentUpdate,
    TaxInvestmentResponse,
    Tax80CSummary,
    TaxOverviewResponse,
    TaxRegimeComparison,
)
from app.services.calculations.tax_engine import (
    compute_80c_summary,
    compute_deductions_breakdown,
    compare_tax_regimes,
)


def get_tax_collection():
    return get_database().tax_investments


def get_users_collection():
    return get_database().users


def get_tax_rules_config() -> Dict[str, Any]:
    """Return backend-configured tax rules, categories, limits, and disclaimers."""
    return {
        "section_80c_limit": SECTION_80C_MAX_LIMIT,
        "section_80ccd_1b_limit": SECTION_80CCD_1B_MAX_LIMIT,
        "section_80d_limit": SECTION_80D_SELF_LIMIT + SECTION_80D_PARENTS_SENIOR_LIMIT,
        "standard_deduction_new": STANDARD_DEDUCTION_NEW_REGIME,
        "standard_deduction_old": STANDARD_DEDUCTION_OLD_REGIME,
        "supported_categories": SUPPORTED_TAX_CATEGORIES,
        "disclaimer": TAX_DISCLAIMER,
    }


def create_tax_investment(
    user_id: ObjectId, data: TaxInvestmentCreate
) -> TaxInvestmentResponse:
    """Create a new tax investment record for user."""
    col = get_tax_collection()
    doc = create_tax_investment_document(
        user_id=user_id,
        financial_year=data.financial_year,
        category=data.category,
        section=data.section,
        name=data.name,
        amount=data.amount,
        notes=data.notes,
    )
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return TaxInvestmentResponse(**tax_investment_helper(doc))


def get_tax_investments(
    user_id: ObjectId, financial_year: str = "2025-26"
) -> List[TaxInvestmentResponse]:
    """Retrieve all user tax investments for a specific financial year."""
    col = get_tax_collection()
    cursor = col.find({"user_id": user_id, "financial_year": financial_year}).sort("created_at", -1)
    return [TaxInvestmentResponse(**tax_investment_helper(d)) for d in cursor]


def get_tax_investment_by_id(user_id: ObjectId, item_id: str) -> TaxInvestmentResponse:
    """Fetch single tax investment by ID."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

    doc = get_tax_collection().find_one({"_id": ObjectId(item_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax investment not found")

    return TaxInvestmentResponse(**tax_investment_helper(doc))


def update_tax_investment(
    user_id: ObjectId, item_id: str, data: TaxInvestmentUpdate
) -> TaxInvestmentResponse:
    """Update an existing tax investment record."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

    col = get_tax_collection()
    doc = col.find_one({"_id": ObjectId(item_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax investment not found")

    updates: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.name is not None:
        updates["name"] = data.name.strip()
    if data.category is not None:
        updates["category"] = data.category.strip()
    if data.section is not None:
        updates["section"] = data.section.strip()
    if data.amount is not None:
        updates["amount"] = round(float(data.amount), 2)
    if data.financial_year is not None:
        updates["financial_year"] = data.financial_year.strip()
    if data.notes is not None:
        updates["notes"] = data.notes.strip()

    col.update_one({"_id": ObjectId(item_id)}, {"$set": updates})
    updated = col.find_one({"_id": ObjectId(item_id)})
    return TaxInvestmentResponse(**tax_investment_helper(updated))


def delete_tax_investment(user_id: ObjectId, item_id: str) -> Dict[str, Any]:
    """Delete a tax investment record."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

    col = get_tax_collection()
    result = col.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax investment not found")

    return {"message": "Tax investment successfully deleted", "id": item_id}


def get_tax_overview(
    user_id: ObjectId,
    financial_year: str = "2025-26",
    custom_gross_income: Optional[float] = None,
) -> TaxOverviewResponse:
    """
    Consolidates user's tax records, computes 80C summary, section deductions,
    and runs deterministic New vs Old regime comparison based on user's annual income.
    """
    # 1. Determine Annual Gross Income
    if custom_gross_income is not None and custom_gross_income > 0:
        annual_gross = float(custom_gross_income)
    else:
        user_doc = get_users_collection().find_one({"_id": user_id})
        monthly_inc = float(user_doc.get("monthly_income", 0.0)) if user_doc else 0.0
        annual_gross = monthly_inc * 12.0
        if annual_gross <= 0:
            annual_gross = 1200000.0  # ₹12,00,000 default benchmark if income is unset

    # 2. Fetch User Tax Investments
    col = get_tax_collection()
    raw_investments = list(col.find({"user_id": user_id, "financial_year": financial_year}))

    # 3. Calculate 80C summary
    summary_80c_dict = compute_80c_summary(raw_investments)
    summary_80c = Tax80CSummary(**summary_80c_dict)

    # 4. Calculate Other Deductions & Total
    other_deductions_map, total_allowable = compute_deductions_breakdown(raw_investments)

    # 5. Deterministic Regime Comparison
    comparison_dict = compare_tax_regimes(
        gross_income=annual_gross,
        total_deductions=total_allowable,
        financial_year=financial_year,
    )
    comparison = TaxRegimeComparison(**comparison_dict)

    # 6. Format Investment Response Items
    investment_items = [
        TaxInvestmentResponse(**tax_investment_helper(inv)) for inv in raw_investments
    ]

    return TaxOverviewResponse(
        financial_year=financial_year,
        gross_annual_income=round(annual_gross, 2),
        summary_80c=summary_80c,
        other_deductions=other_deductions_map,
        total_allowable_deductions=total_allowable,
        investments=investment_items,
        comparison=comparison,
        disclaimer=TAX_DISCLAIMER,
        supported_categories=SUPPORTED_TAX_CATEGORIES,
    )


def simulate_regime_comparison(
    user_id: ObjectId,
    annual_gross_income: float,
    financial_year: str = "2025-26",
) -> TaxRegimeComparison:
    """Run real-time scenario simulation for New vs Old Regime with user's stored deductions."""
    col = get_tax_collection()
    raw_investments = list(col.find({"user_id": user_id, "financial_year": financial_year}))
    _, total_allowable = compute_deductions_breakdown(raw_investments)

    comp_dict = compare_tax_regimes(
        gross_income=annual_gross_income,
        total_deductions=total_allowable,
        financial_year=financial_year,
    )
    return TaxRegimeComparison(**comp_dict)
