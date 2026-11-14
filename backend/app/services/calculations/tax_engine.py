"""
Pure Python Deterministic Tax Calculation Engine.
Calculates Section 80C deductions, allowable caps, New vs Old Regime tax slabs,
Section 87A rebates, and cess with 100% deterministic precision.
"""

from typing import Any, Dict, List, Tuple
from app.core.tax_config import (
    SECTION_80C_MAX_LIMIT,
    SECTION_80CCD_1B_MAX_LIMIT,
    SECTION_80D_SELF_LIMIT,
    SECTION_80D_PARENTS_SENIOR_LIMIT,
    STANDARD_DEDUCTION_NEW_REGIME,
    STANDARD_DEDUCTION_OLD_REGIME,
    CESS_RATE,
    REBATE_87A_NEW_REGIME_THRESHOLD,
    REBATE_87A_OLD_REGIME_THRESHOLD,
    NEW_REGIME_SLABS,
    OLD_REGIME_SLABS,
)


def compute_80c_summary(investments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes Section 80C breakdown across user-entered eligible instruments
    (PPF, ELSS, LIC, NSC, EPF, 5Y_FD, SSY, etc.) and enforces the statutory ₹1.5 Lakh limit.
    """
    category_totals: Dict[str, float] = {
        "PPF": 0.0,
        "ELSS": 0.0,
        "LIC": 0.0,
        "NSC": 0.0,
        "EPF": 0.0,
    }

    total_eligible = 0.0
    for inv in investments:
        section = (inv.get("section") or "80C").strip().upper()
        if section == "80C":
            amt = max(0.0, float(inv.get("amount", 0.0)))
            cat = (inv.get("category") or "Other").strip().upper()
            category_totals[cat] = round(category_totals.get(cat, 0.0) + amt, 2)
            total_eligible += amt

    total_eligible = round(total_eligible, 2)
    allowable = min(total_eligible, SECTION_80C_MAX_LIMIT)
    remaining_headroom = max(0.0, round(SECTION_80C_MAX_LIMIT - total_eligible, 2))
    utilization = (
        round(min(100.0, (total_eligible / SECTION_80C_MAX_LIMIT) * 100.0), 2)
        if SECTION_80C_MAX_LIMIT > 0
        else 0.0
    )

    return {
        "total_eligible_80c": total_eligible,
        "cap_80c": SECTION_80C_MAX_LIMIT,
        "allowable_deduction_80c": allowable,
        "remaining_80c_limit": remaining_headroom,
        "utilization_percentage": utilization,
        "category_breakdown": category_totals,
    }


def compute_deductions_breakdown(
    investments: List[Dict[str, Any]]
) -> Tuple[Dict[str, float], float]:
    """
    Computes non-80C eligible deductions (80CCD(1B), 80D) and returns
    (deductions_map, total_allowable_deductions).
    """
    nps_eligible = 0.0
    health_eligible = 0.0

    for inv in investments:
        sec = (inv.get("section") or "").strip().upper()
        amt = max(0.0, float(inv.get("amount", 0.0)))
        if "80CCD" in sec:
            nps_eligible += amt
        elif "80D" in sec:
            health_eligible += amt

    allowable_80c = compute_80c_summary(investments)["allowable_deduction_80c"]
    allowable_nps = min(round(nps_eligible, 2), SECTION_80CCD_1B_MAX_LIMIT)
    max_health_limit = SECTION_80D_SELF_LIMIT + SECTION_80D_PARENTS_SENIOR_LIMIT
    allowable_health = min(round(health_eligible, 2), max_health_limit)

    total_allowable = round(allowable_80c + allowable_nps + allowable_health, 2)
    breakdown = {
        "80C": allowable_80c,
        "80CCD_1B_NPS": allowable_nps,
        "80D_Health": allowable_health,
    }
    return breakdown, total_allowable


def compute_new_regime_tax(gross_income: float) -> Dict[str, Any]:
    """
    Computes income tax liability under the New Tax Regime (FY 2024-25 / 2025-26).
    Applies ₹75,000 standard deduction, slab rates, Section 87A rebate (up to ₹7L), and 4% cess.
    """
    gross = max(0.0, float(gross_income))
    std_deduction = min(gross, STANDARD_DEDUCTION_NEW_REGIME)
    taxable_income = max(0.0, round(gross - std_deduction, 2))

    base_tax = 0.0
    for slab in NEW_REGIME_SLABS:
        s_min = slab["min"]
        s_max = slab["max"]
        rate = slab["rate"]
        if taxable_income > s_min:
            taxable_in_slab = min(taxable_income, s_max) - s_min
            base_tax += taxable_in_slab * rate

    base_tax = round(base_tax, 2)

    # Section 87A Rebate in New Regime (if taxable income <= 7 Lakhs, full rebate)
    rebate_87a = 0.0
    if taxable_income <= REBATE_87A_NEW_REGIME_THRESHOLD:
        rebate_87a = base_tax
        tax_after_rebate = 0.0
    else:
        tax_after_rebate = base_tax

    cess = round(tax_after_rebate * CESS_RATE, 2)
    total_tax = round(tax_after_rebate + cess, 2)
    effective_rate = round((total_tax / gross) * 100.0, 2) if gross > 0 else 0.0

    return {
        "gross_income": round(gross, 2),
        "standard_deduction": std_deduction,
        "total_exemptions_deductions": std_deduction,
        "taxable_income": taxable_income,
        "base_tax": base_tax,
        "rebate_87a": rebate_87a,
        "cess": cess,
        "total_tax_payable": total_tax,
        "effective_tax_rate": effective_rate,
    }


def compute_old_regime_tax(gross_income: float, total_deductions: float) -> Dict[str, Any]:
    """
    Computes income tax liability under the Old Tax Regime.
    Applies ₹50,000 standard deduction, eligible deductions (80C, 80CCD, 80D),
    slab rates, Section 87A rebate (up to ₹5L), and 4% cess.
    """
    gross = max(0.0, float(gross_income))
    std_deduction = min(gross, STANDARD_DEDUCTION_OLD_REGIME)
    allowable_deductions = max(0.0, float(total_deductions))
    total_exemptions = round(std_deduction + allowable_deductions, 2)
    taxable_income = max(0.0, round(gross - total_exemptions, 2))

    base_tax = 0.0
    for slab in OLD_REGIME_SLABS:
        s_min = slab["min"]
        s_max = slab["max"]
        rate = slab["rate"]
        if taxable_income > s_min:
            taxable_in_slab = min(taxable_income, s_max) - s_min
            base_tax += taxable_in_slab * rate

    base_tax = round(base_tax, 2)

    # Section 87A Rebate in Old Regime (if taxable income <= 5 Lakhs, full rebate up to ₹12,500)
    rebate_87a = 0.0
    if taxable_income <= REBATE_87A_OLD_REGIME_THRESHOLD:
        rebate_87a = min(base_tax, 12500.0)
        tax_after_rebate = max(0.0, round(base_tax - rebate_87a, 2))
    else:
        tax_after_rebate = base_tax

    cess = round(tax_after_rebate * CESS_RATE, 2)
    total_tax = round(tax_after_rebate + cess, 2)
    effective_rate = round((total_tax / gross) * 100.0, 2) if gross > 0 else 0.0

    return {
        "gross_income": round(gross, 2),
        "standard_deduction": std_deduction,
        "total_exemptions_deductions": total_exemptions,
        "taxable_income": taxable_income,
        "base_tax": base_tax,
        "rebate_87a": rebate_87a,
        "cess": cess,
        "total_tax_payable": total_tax,
        "effective_tax_rate": effective_rate,
    }


def compare_tax_regimes(
    gross_income: float,
    total_deductions: float,
    financial_year: str = "2025-26",
) -> Dict[str, Any]:
    """
    Compares New vs Old Tax Regime and generates a factual savings recommendation.
    """
    new_tax = compute_new_regime_tax(gross_income)
    old_tax = compute_old_regime_tax(gross_income, total_deductions)

    new_payable = new_tax["total_tax_payable"]
    old_payable = old_tax["total_tax_payable"]
    diff = round(abs(old_payable - new_payable), 2)

    if new_payable < old_payable:
        recommended = "New Regime"
        recommendation_text = (
            f"The New Tax Regime is more beneficial, saving approximately ₹{diff:,.0f} "
            f"in annual tax compared to the Old Regime."
        )
    elif old_payable < new_payable:
        recommended = "Old Regime"
        recommendation_text = (
            f"The Old Tax Regime is more beneficial due to your ₹{total_deductions:,.0f} "
            f"in deductions, saving approximately ₹{diff:,.0f} in annual tax."
        )
    else:
        recommended = "Equal Tax Liability"
        recommendation_text = "Both regimes yield an identical tax liability for your current income profile."

    return {
        "financial_year": financial_year,
        "gross_annual_income": round(gross_income, 2),
        "old_regime": old_tax,
        "new_regime": new_tax,
        "tax_difference": diff,
        "recommended_regime": recommended,
        "savings_recommendation": recommendation_text,
    }
