"""
Pure Python Deterministic What-If Simulation Engine.
Computes multi-module sensitivity analysis:
- Cashflow & Savings Rate
- 5-Pillar Financial Health Score (0-100) & Risk Level
- Emergency Fund Runway & Coverage
- 10-Year SIP Wealth Accumulation Trajectory
- Goal Feasibility & Velocity
- Debt-to-Income (DTI) & Net Financial Impact
"""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.services.calculations.financial_engine import (
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_runway,
    calculate_financial_health,
)


def _compute_sip_future_value(monthly_investment: float, annual_return_rate: float, years: int) -> float:
    """Calculates FV of monthly SIP compounding annuity at beginning of period."""
    p = max(0.0, float(monthly_investment))
    r = max(0.0, float(annual_return_rate))
    total_months = max(1, years * 12)

    if p <= 0:
        return 0.0

    monthly_rate = (r / 100.0) / 12.0
    if monthly_rate <= 0:
        return round(p * total_months, 2)

    fv = p * (((1.0 + monthly_rate) ** total_months - 1.0) / monthly_rate) * (1.0 + monthly_rate)
    return round(fv, 2)


def _build_metric_comparison(baseline: float, whatif: float, higher_is_better: bool = True) -> Dict[str, Any]:
    """Generates delta and percentage difference with improvement polarity."""
    b = round(float(baseline), 2)
    w = round(float(whatif), 2)
    delta = round(w - b, 2)

    if b != 0:
        delta_pct = round((delta / abs(b)) * 100.0, 1)
    else:
        delta_pct = 100.0 if delta > 0 else (-100.0 if delta < 0 else 0.0)

    is_improvement = (delta >= 0) if higher_is_better else (delta <= 0)

    return {
        "baseline": b,
        "what_if": w,
        "delta": delta,
        "delta_percent": delta_pct,
        "is_improvement": is_improvement,
    }


def run_whatif_simulation(
    baseline_profile: Dict[str, Any],
    whatif_inputs: Dict[str, Any],
    active_goals: Optional[List[Dict[str, Any]]] = None,
    active_debts: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Executes a complete deterministic sensitivity simulation comparing
    the baseline financial state against hypothetical scenario overrides.
    """
    active_goals = active_goals or []
    active_debts = active_debts or []

    # 1. Baseline parameters
    b_income = max(0.0, float(baseline_profile.get("monthly_income", 0.0)))
    b_expenses = max(0.0, float(baseline_profile.get("monthly_expenses", 0.0)))
    b_savings = max(0.0, float(baseline_profile.get("current_savings", 0.0)))
    b_emi = max(0.0, float(baseline_profile.get("monthly_emi", 0.0)))
    b_invest = max(0.0, float(baseline_profile.get("monthly_investment", 0.0)))
    b_return = max(0.0, float(baseline_profile.get("investment_return_rate", 12.0)))

    # 2. What-If Overrides
    w_income = (
        max(0.0, float(whatif_inputs["monthly_income"]))
        if whatif_inputs.get("monthly_income") is not None
        else b_income
    )
    w_expenses = (
        max(0.0, float(whatif_inputs["monthly_expenses"]))
        if whatif_inputs.get("monthly_expenses") is not None
        else b_expenses
    )
    w_savings = (
        max(0.0, float(whatif_inputs["current_savings"]))
        if whatif_inputs.get("current_savings") is not None
        else b_savings
    )
    w_emi = (
        max(0.0, float(whatif_inputs["monthly_emi"]))
        if whatif_inputs.get("monthly_emi") is not None
        else b_emi
    )
    w_invest = (
        max(0.0, float(whatif_inputs["monthly_investment"]))
        if whatif_inputs.get("monthly_investment") is not None
        else b_invest
    )
    w_return = (
        max(0.0, float(whatif_inputs["investment_return_rate"]))
        if whatif_inputs.get("investment_return_rate") is not None
        else b_return
    )
    target_goal_contribution = (
        max(0.0, float(whatif_inputs["target_goal_contribution"]))
        if whatif_inputs.get("target_goal_contribution") is not None
        else 0.0
    )

    # 3. Core Baseline Calculations
    b_surplus = calculate_surplus(b_income, b_expenses)
    b_savings_rate = calculate_savings_rate(b_income, b_expenses)
    b_runway = calculate_emergency_runway(b_savings, b_expenses, b_emi)
    b_dti = round((b_emi / b_income * 100.0), 1) if b_income > 0 else 0.0
    b_health = calculate_financial_health(b_income, b_expenses, b_savings, b_emi, b_invest)
    b_fv10 = _compute_sip_future_value(b_invest, b_return, 10)

    # 4. Core What-If Calculations
    w_surplus = calculate_surplus(w_income, w_expenses)
    w_savings_rate = calculate_savings_rate(w_income, w_expenses)
    w_runway = calculate_emergency_runway(w_savings, w_expenses, w_emi)
    w_dti = round((w_emi / w_income * 100.0), 1) if w_income > 0 else 0.0
    w_health = calculate_financial_health(w_income, w_expenses, w_savings, w_emi, w_invest)
    w_fv10 = _compute_sip_future_value(w_invest, w_return, 10)

    # 5. Pillar-by-Pillar Comparison
    pillar_map = {}
    for p in b_health.pillars:
        pillar_map[p.name] = {"baseline": p}
    for p in w_health.pillars:
        if p.name in pillar_map:
            pillar_map[p.name]["whatif"] = p

    pillar_breakdown = []
    for name, p_pair in pillar_map.items():
        bp = p_pair.get("baseline")
        wp = p_pair.get("whatif")
        if bp and wp:
            pillar_breakdown.append({
                "name": name,
                "baseline_score": bp.score,
                "whatif_score": wp.score,
                "delta": round(wp.score - bp.score, 1),
                "max_score": bp.max_score,
                "baseline_status": bp.status,
                "whatif_status": wp.status,
            })

    # 6. Wealth Accumulation Trajectory (10-Year Annual Points)
    wealth_trajectory = []
    for y in range(1, 11):
        b_fv_y = _compute_sip_future_value(b_invest, b_return, y)
        w_fv_y = _compute_sip_future_value(w_invest, w_return, y)
        wealth_trajectory.append({
            "year": y,
            "baseline_wealth": b_fv_y,
            "whatif_wealth": w_fv_y,
            "wealth_delta": round(w_fv_y - b_fv_y, 2),
        })

    # 7. Goals Impact Evaluation
    goals_impact = []
    now_dt = datetime.now(timezone.utc)
    for g in active_goals:
        target_amt = float(g.get("target_amount", 0.0))
        saved_amt = float(g.get("current_saved", 0.0))
        rem = max(0.0, target_amt - saved_amt)

        # Calculate months remaining
        t_date_str = g.get("target_date", "")
        months_left = 12
        try:
            target_dt = datetime.fromisoformat(t_date_str.replace("Z", "+00:00"))
            days_diff = (target_dt - now_dt).days
            months_left = max(1, int(days_diff / 30.4375))
        except Exception:
            pass

        monthly_req = round(rem / months_left, 2) if months_left > 0 else rem
        b_on_track = b_surplus >= monthly_req
        w_on_track = w_surplus >= monthly_req

        months_saved = 0
        if target_goal_contribution > 0 and rem > 0:
            accelerated_months = max(1, math.ceil(rem / target_goal_contribution))
            months_saved = max(0, months_left - accelerated_months)

        goals_impact.append({
            "goal_id": str(g.get("id") or g.get("_id")),
            "goal_name": g.get("goal_name", "Goal"),
            "target_amount": target_amt,
            "current_saved": saved_amt,
            "target_date": t_date_str,
            "monthly_required": monthly_req,
            "baseline_on_track": b_on_track,
            "whatif_on_track": w_on_track,
            "months_saved": months_saved,
        })

    # 8. Net Financial Impact Evaluation & Narrative
    annual_cashflow_delta = round((w_surplus - b_surplus) * 12.0, 2)
    score_delta = int(w_health.health_score - b_health.health_score)
    runway_delta_months = round(w_runway - b_runway, 2)
    wealth_10y_delta = round(w_fv10 - b_fv10, 2)

    takeaways = []
    if annual_cashflow_delta > 0:
        takeaways.append(f"Unlocks an extra ₹{annual_cashflow_delta:,.2f} in annual net liquidity.")
    elif annual_cashflow_delta < 0:
        takeaways.append(f"Reduces net annual cashflow by ₹{abs(annual_cashflow_delta):,.2f}.")

    if score_delta > 0:
        takeaways.append(f"Improves overall Financial Health Score by +{score_delta} points ({b_health.health_score} -> {w_health.health_score}).")
    elif score_delta < 0:
        takeaways.append(f"Health score decreases by {score_delta} points ({b_health.health_score} -> {w_health.health_score}).")

    if runway_delta_months > 0:
        takeaways.append(f"Extends emergency survival runway by +{runway_delta_months:.1f} months.")
    elif runway_delta_months < 0:
        takeaways.append(f"Shortens emergency survival runway by {abs(runway_delta_months):.1f} months.")

    if wealth_10y_delta > 0:
        takeaways.append(f"Compounds to an additional ₹{wealth_10y_delta:,.2f} in wealth over 10 years.")
    elif wealth_10y_delta < 0:
        takeaways.append(f"Sacrifices ₹{abs(wealth_10y_delta):,.2f} in potential 10-year wealth compounding.")

    # Rating determination
    if score_delta >= 10 or annual_cashflow_delta >= 60000.0 or wealth_10y_delta >= 100000.0:
        rating = "Highly Positive"
        headline = "Strong Financial Acceleration — This scenario substantially strengthens your financial resilience."
    elif score_delta > 0 or annual_cashflow_delta > 0 or wealth_10y_delta > 0:
        rating = "Moderately Positive"
        headline = "Net Positive Scenario — Clear incremental gains in cashflow and long-term security."
    elif score_delta == 0 and annual_cashflow_delta == 0:
        rating = "Neutral"
        headline = "Neutral Financial Trajectory — No net change to your cashflow or capital foundation."
    elif w_surplus < 0:
        rating = "Critical Outflow Risk"
        headline = "Warning: Negative Monthly Cashflow — Expenses exceed income, leading to rapid capital depletion."
    else:
        rating = "Cautionary / Cashflow Strain"
        headline = "Cautionary Scenario — Higher liabilities reduce cashflow flexibility and savings velocity."

    net_financial_impact = {
        "annual_cashflow_delta": annual_cashflow_delta,
        "health_score_delta": score_delta,
        "runway_delta_months": runway_delta_months,
        "wealth_10y_delta": wealth_10y_delta,
        "rating": rating,
        "headline": headline,
        "takeaways": takeaways,
    }

    # 9. Assembling Metrics Map
    metrics = {
        "monthly_surplus": _build_metric_comparison(b_surplus, w_surplus, higher_is_better=True),
        "savings_rate": _build_metric_comparison(b_savings_rate, w_savings_rate, higher_is_better=True),
        "health_score": _build_metric_comparison(b_health.health_score, w_health.health_score, higher_is_better=True),
        "emergency_runway": _build_metric_comparison(b_runway, w_runway, higher_is_better=True),
        "dti_ratio": _build_metric_comparison(b_dti, w_dti, higher_is_better=False),
        "wealth_10y": _build_metric_comparison(b_fv10, w_fv10, higher_is_better=True),
    }

    return {
        "baseline_profile": {
            "monthly_income": b_income,
            "monthly_expenses": b_expenses,
            "current_savings": b_savings,
            "monthly_emi": b_emi,
            "monthly_investment": b_invest,
            "investment_return_rate": b_return,
            "surplus": b_surplus,
            "savings_rate": b_savings_rate,
            "health_score": b_health.health_score,
            "risk_level": b_health.risk_level,
            "runway_months": b_runway,
            "dti_ratio": b_dti,
            "fv_10y": b_fv10,
        },
        "simulated_inputs": {
            "monthly_income": w_income,
            "monthly_expenses": w_expenses,
            "current_savings": w_savings,
            "monthly_emi": w_emi,
            "monthly_investment": w_invest,
            "investment_return_rate": w_return,
            "surplus": w_surplus,
            "savings_rate": w_savings_rate,
            "health_score": w_health.health_score,
            "risk_level": w_health.risk_level,
            "runway_months": w_runway,
            "dti_ratio": w_dti,
            "fv_10y": w_fv10,
        },

        "metrics": metrics,
        "pillar_breakdown": pillar_breakdown,
        "wealth_trajectory": wealth_trajectory,
        "goals_impact": goals_impact,
        "net_financial_impact": net_financial_impact,
    }
