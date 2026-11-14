"""
SMARTFIN Deterministic Financial Calculation Engine.

ARCHITECTURE RULE:
All financial calculations must be performed deterministically by Python backend services.
Gemini must NOT be responsible for authoritative financial calculations.
"""

from typing import Dict, List, Tuple, Optional
from bson import ObjectId
from app.schemas.calculations import PillarScore, FinancialHealthResponse
from app.schemas.emergency_fund import EmergencyFundResponse
from app.models.score_history import create_score_history_document
from app.database.mongodb import get_database


def calculate_surplus(income: float, expenses: float) -> float:
    """
    Calculate monthly cashflow surplus.
    Formula: surplus = income - expenses
    """
    return round(float(income) - float(expenses), 2)


def calculate_savings_rate(income: float, expenses: float) -> float:
    """
    Calculate savings rate as a percentage of income.
    Formula: savings_rate = surplus / income * 100
    Safely handles income <= 0 without division by zero.
    """
    if income <= 0:
        return 0.0
    surplus = calculate_surplus(income, expenses)
    rate = (surplus / income) * 100.0
    return round(max(0.0, rate), 2)


def calculate_emergency_runway(
    savings: float, monthly_expenses: float, monthly_emi: float = 0.0
) -> float:
    """
    Calculate emergency fund survival runway in months.
    Formula: savings / (monthly_expenses + monthly_emi)
    """
    monthly_burn = monthly_expenses + monthly_emi
    if monthly_burn <= 0:
        return 12.0 if savings > 0 else 0.0
    runway = savings / monthly_burn
    return round(max(0.0, runway), 2)


def calculate_emergency_fund(
    current_savings: float, monthly_expenses: float
) -> EmergencyFundResponse:
    """
    Dedicated Emergency Fund calculations:
    - Emergency Target = Monthly Expenses * 6
    - Months covered = Current Savings / Monthly Expenses (safe when expenses=0)
    - Percentage completed = min(100, savings / target * 100)
    - Amount still required = max(0, target - savings)
    """
    savings = max(0.0, float(current_savings))
    expenses = max(0.0, float(monthly_expenses))
    target_amount = round(expenses * 6.0, 2)

    if expenses <= 0:
        months_covered = 12.0 if savings > 0 else 0.0
        percentage_completed = 100.0 if savings > 0 else 0.0
        amount_still_required = 0.0
        status = "Optimal" if savings > 0 else "Critical"
        recommendation = (
            "Monthly living expenses are currently set to ₹0.00. "
            "Please update your expenses in Profile to accurately calculate your 6-month reserve target."
        )
    else:
        months_covered = round(savings / expenses, 2)
        if target_amount > 0:
            percentage_completed = round(min(100.0, (savings / target_amount) * 100.0), 1)
        else:
            percentage_completed = 100.0

        amount_still_required = round(max(0.0, target_amount - savings), 2)

        if months_covered >= 6.0:
            status = "Optimal"
            recommendation = (
                f"Outstanding liquidity! Your current savings cover {months_covered:.1f} months of expenses, "
                f"exceeding the standard 6-month reserve requirement (₹{target_amount:,.2f})."
            )
        elif months_covered >= 3.0:
            status = "Adequate"
            recommendation = (
                f"Solid emergency reserve covering {months_covered:.1f} months. "
                f"Save an additional ₹{amount_still_required:,.2f} to complete your full 6-month security cushion."
            )
        elif months_covered >= 1.0:
            status = "Vulnerable"
            recommendation = (
                f"Vulnerable liquidity covering only {months_covered:.1f} months. "
                f"Aim to prioritize monthly contributions of ₹{amount_still_required:,.2f} until you achieve at least 3 months."
            )
        else:
            status = "Critical"
            recommendation = (
                f"Critical liquidity risk: less than 1 month ({months_covered:.1f} months) of living expenses saved. "
                f"Focus urgently on accumulating a starter emergency cushion."
            )

    return EmergencyFundResponse(
        target_amount=target_amount,
        current_savings=savings,
        percentage_completed=percentage_completed,
        months_covered=months_covered,
        amount_still_required=amount_still_required,
        monthly_expenses=expenses,
        status=status,
        recommendation=recommendation,
    )


def calculate_savings_rate_score(savings_rate: float) -> PillarScore:
    """Pillar 1: Savings Rate (Max 25 points)."""
    max_pts = 25.0
    if savings_rate <= 0:
        score = 0.0
        status = "Critical"
        insight = "Zero or negative savings rate. All income is being consumed."
    elif savings_rate >= 20.0:
        score = 25.0
        status = "Optimal"
        insight = f"Outstanding savings habit ({savings_rate:.1f}% >= 20% target)."
    else:
        score = round((savings_rate / 20.0) * max_pts, 1)
        status = "Moderate"
        insight = f"Savings rate of {savings_rate:.1f}% is below the ideal 20% benchmark."

    score = max(0.0, min(max_pts, score))
    return PillarScore(
        name="Savings Rate",
        score=score,
        max_score=max_pts,
        percentage=round((score / max_pts) * 100, 1),
        status=status,
        insight=insight,
    )


def calculate_emergency_fund_score(runway_months: float) -> PillarScore:
    """Pillar 2: Emergency Fund (Max 20 points)."""
    max_pts = 20.0
    if runway_months >= 6.0:
        score = 20.0
        status = "Optimal"
        insight = f"Strong liquidity reserve with {runway_months:.1f} months of expenses saved."
    elif runway_months >= 3.0:
        score = round(15.0 + ((runway_months - 3.0) / 3.0) * 5.0, 1)
        status = "Good"
        insight = f"Adequate reserve ({runway_months:.1f} months). Recommended target is 6 months."
    elif runway_months >= 1.0:
        score = round(10.0 + ((runway_months - 1.0) / 2.0) * 5.0, 1)
        status = "Vulnerable"
        insight = f"Thin safety net ({runway_months:.1f} months). Aim to accumulate at least 3 months."
    elif runway_months > 0:
        score = round(runway_months * 10.0, 1)
        status = "Critical"
        insight = f"Less than 1 month of survival runway ({runway_months:.1f} months)."
    else:
        score = 0.0
        status = "Critical"
        insight = "No liquid emergency savings detected."

    score = max(0.0, min(max_pts, score))
    return PillarScore(
        name="Emergency Fund",
        score=score,
        max_score=max_pts,
        percentage=round((score / max_pts) * 100, 1),
        status=status,
        insight=insight,
    )


def calculate_emi_burden_score(income: float, monthly_emi: float) -> Tuple[PillarScore, float]:
    """Pillar 3: EMI Burden (Max 20 points)."""
    max_pts = 20.0
    if income <= 0:
        dti = 100.0 if monthly_emi > 0 else 0.0
    else:
        dti = round((monthly_emi / income) * 100.0, 1)

    if monthly_emi == 0:
        score = 20.0
        status = "Optimal"
        insight = "100% Debt-free! Zero monthly EMI liabilities."
    elif dti <= 20.0:
        score = 20.0
        status = "Optimal"
        insight = f"Healthy debt-to-income ratio ({dti:.1f}% <= 20%)."
    elif dti <= 35.0:
        score = round(15.0 + ((35.0 - dti) / 15.0) * 5.0, 1)
        status = "Moderate"
        insight = f"Manageable EMI load ({dti:.1f}%). Keep below 35% to avoid cashflow strain."
    elif dti <= 50.0:
        score = round(5.0 + ((50.0 - dti) / 15.0) * 10.0, 1)
        status = "High"
        insight = f"Heavy debt burden ({dti:.1f}%). EMI consumes significant cashflow."
    else:
        score = 0.0
        status = "Critical"
        insight = f"Critical debt stress ({dti:.1f}% > 50%). Urgent payoff plan required."

    score = max(0.0, min(max_pts, score))
    return (
        PillarScore(
            name="EMI Burden",
            score=score,
            max_score=max_pts,
            percentage=round((score / max_pts) * 100, 1),
            status=status,
            insight=insight,
        ),
        dti,
    )


def calculate_investment_habit_score(
    income: float, monthly_investment: float
) -> Tuple[PillarScore, float]:
    """Pillar 4: Investment Habit (Max 20 points)."""
    max_pts = 20.0
    if income <= 0:
        invest_rate = 0.0
    else:
        invest_rate = round((monthly_investment / income) * 100.0, 1)

    if invest_rate >= 15.0:
        score = 20.0
        status = "Optimal"
        insight = f"Exceptional wealth compounding habit ({invest_rate:.1f}% of income invested)."
    elif invest_rate >= 10.0:
        score = round(15.0 + ((invest_rate - 10.0) / 5.0) * 5.0, 1)
        status = "Good"
        insight = f"Solid investment pace ({invest_rate:.1f}%). Target 15% for accelerated growth."
    elif invest_rate >= 5.0:
        score = round(10.0 + ((invest_rate - 5.0) / 5.0) * 5.0, 1)
        status = "Moderate"
        insight = f"Modest investment rate ({invest_rate:.1f}%). Consider stepping up SIPs."
    elif invest_rate > 0:
        score = round(invest_rate * 2.0, 1)
        status = "Low"
        insight = f"Very low investment rate ({invest_rate:.1f}%)."
    else:
        score = 0.0
        status = "Inactive"
        insight = "No active monthly investments recorded."

    score = max(0.0, min(max_pts, score))
    return (
        PillarScore(
            name="Investment Habit",
            score=score,
            max_score=max_pts,
            percentage=round((score / max_pts) * 100, 1),
            status=status,
            insight=insight,
        ),
        invest_rate,
    )


def calculate_expense_ratio_score(
    income: float, monthly_expenses: float
) -> Tuple[PillarScore, float]:
    """Pillar 5: Expense Ratio (Max 15 points)."""
    max_pts = 15.0
    if income <= 0:
        ratio = 100.0 if monthly_expenses > 0 else 0.0
        score = 15.0 if monthly_expenses == 0 else 0.0
        status = "Optimal" if monthly_expenses == 0 else "Critical"
        insight = "Zero income baseline."
    else:
        ratio = round((monthly_expenses / income) * 100.0, 1)
        if ratio <= 50.0:
            score = 15.0
            status = "Optimal"
            insight = f"Living within means ({ratio:.1f}% <= 50% needs limit)."
        elif ratio <= 70.0:
            score = round(10.0 + ((70.0 - ratio) / 20.0) * 5.0, 1)
            status = "Moderate"
            insight = f"Expenses at {ratio:.1f}% of income. Room for budget optimization."
        elif ratio <= 90.0:
            score = round(5.0 + ((90.0 - ratio) / 20.0) * 5.0, 1)
            status = "High"
            insight = f"High expense velocity ({ratio:.1f}%). Very little margin for savings."
        else:
            score = 0.0
            status = "Critical"
            insight = f"Critical outflow ({ratio:.1f}% > 90%). High vulnerability."

    score = max(0.0, min(max_pts, score))
    return (
        PillarScore(
            name="Expense Ratio",
            score=score,
            max_score=max_pts,
            percentage=round((score / max_pts) * 100, 1),
            status=status,
            insight=insight,
        ),
        ratio,
    )


def determine_risk_level(score: int) -> str:
    """Categorize score into risk levels."""
    if score >= 80:
        return "Low Risk / Excellent"
    elif score >= 60:
        return "Medium Risk / Good"
    else:
        return "High Risk / Needs Attention"


def calculate_financial_health(
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    monthly_emi: float = 0.0,
    monthly_investment: float = 0.0,
) -> FinancialHealthResponse:
    """Master function to calculate Financial Health Score (0-100)."""
    income = max(0.0, float(monthly_income))
    expenses = max(0.0, float(monthly_expenses))
    savings = max(0.0, float(current_savings))
    emi = max(0.0, float(monthly_emi))
    investment = max(0.0, float(monthly_investment))

    surplus = calculate_surplus(income, expenses)
    savings_rate = calculate_savings_rate(income, expenses)
    runway = calculate_emergency_runway(savings, expenses, emi)

    p1 = calculate_savings_rate_score(savings_rate)
    p2 = calculate_emergency_fund_score(runway)
    p3, dti = calculate_emi_burden_score(income, emi)
    p4, invest_rate = calculate_investment_habit_score(income, investment)
    p5, expense_ratio = calculate_expense_ratio_score(income, expenses)

    raw_score = p1.score + p2.score + p3.score + p4.score + p5.score
    final_score = int(round(max(0.0, min(100.0, raw_score))))
    risk_level = determine_risk_level(final_score)

    recommendations: List[str] = []
    if p1.score < 18.0:
        recommendations.append("Increase your monthly savings rate towards 20% by auditing discretionary spending.")
    if p2.score < 15.0:
        recommendations.append(f"Build emergency fund from {runway:.1f} months towards a 6-month safety reserve.")
    if p3.score < 15.0:
        recommendations.append(f"Your EMI takes {dti:.1f}% of income. Prioritize debt reduction using the Avalanche method.")
    if p4.score < 15.0:
        recommendations.append("Establish a recurring systematic investment plan (SIP) into index funds or diversified equities.")
    if p5.score < 12.0:
        recommendations.append("Apply the 50/30/20 rule to cap essential monthly expenditures at 50% of take-home pay.")
    if not recommendations:
        recommendations.append("Exceptional financial discipline! Maintain automated contributions and rebalance annually.")

    return FinancialHealthResponse(
        health_score=final_score,
        risk_level=risk_level,
        surplus=surplus,
        savings_rate=savings_rate,
        income=income,
        expenses=expenses,
        emergency_fund_months=runway,
        emi_burden_percentage=dti,
        investment_rate_percentage=invest_rate,
        expense_ratio_percentage=expense_ratio,
        pillars=[p1, p2, p3, p4, p5],
        summary_recommendations=recommendations,
    )


def record_score_history_snapshot(
    user_id: ObjectId, health: FinancialHealthResponse
) -> None:
    """
    Log a snapshot into score_history collection if score or risk level has changed meaningfully.
    """
    db = get_database()
    col = db.score_history
    latest = col.find_one({"user_id": user_id}, sort=[("recorded_at", -1)])

    should_record = False
    if not latest:
        should_record = True
    elif (
        latest.get("score") != health.health_score
        or latest.get("risk_level") != health.risk_level
        or abs(float(latest.get("surplus", 0.0)) - health.surplus) > 10.0
    ):
        should_record = True

    if should_record:
        doc = create_score_history_document(
            user_id=user_id,
            score=health.health_score,
            risk_level=health.risk_level,
            surplus=health.surplus,
            savings_rate=health.savings_rate,
        )
        col.insert_one(doc)
