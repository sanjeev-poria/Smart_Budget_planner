from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from bson import ObjectId

from app.core.deps import get_current_user
from app.database.mongodb import get_database
from app.models.score_history import score_history_helper
from app.schemas.calculations import FinancialHealthResponse, CashflowSummaryResponse
from app.schemas.emergency_fund import EmergencyFundResponse
from app.schemas.spending import (
    CategorySpendingItem,
    MonthlyCashflowItem,
    SpendingOverviewResponse,
)
from app.schemas.dashboard import (
    SummaryCards,
    ScoreBrief,
    BudgetAlert,
    AIInsight,
    DashboardOverviewResponse,
)
from app.services.calculations.financial_engine import (
    calculate_financial_health,
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_fund,
    record_score_history_snapshot,
)
from app.services.transaction_service import get_transactions

router = APIRouter(prefix="/analytics", tags=["Financial Analytics & Calculations"])


@router.get(
    "/financial-health",
    response_model=FinancialHealthResponse,
    summary="Deterministic Financial Health Score & 5-Pillar Analysis",
    description="Computes authoritative 0–100 score, risk categorization, surplus, and savings rate using deterministic Python models."
)
def get_financial_health(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> FinancialHealthResponse:
    """Calculate and return financial health metrics and record snapshot to score_history."""
    profile = current_user.get("financial_profile") or {}

    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    savings = float(profile.get("current_savings", 0.0))
    emi = float(profile.get("monthly_emi", 0.0))
    investment = float(profile.get("monthly_investment", 0.0))

    health = calculate_financial_health(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        monthly_emi=emi,
        monthly_investment=investment,
    )

    # Log snapshot to MongoDB score_history
    record_score_history_snapshot(current_user["_id"], health)
    return health


@router.get(
    "/emergency-fund",
    response_model=EmergencyFundResponse,
    summary="Emergency Fund & Liquidity Runway Analysis",
    description="Calculates 6-month emergency fund target, current liquid reserve coverage, and shortfall."
)
def get_emergency_fund_analysis(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> EmergencyFundResponse:
    """Calculate dedicated emergency fund metrics."""
    profile = current_user.get("financial_profile") or {}
    savings = float(profile.get("current_savings", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    return calculate_emergency_fund(current_savings=savings, monthly_expenses=expenses)


@router.get(
    "/spending-overview",
    response_model=SpendingOverviewResponse,
    summary="Real Transaction Spending Analytics for Recharts",
    description="Aggregates category-wise expenses and monthly cashflow timeline from MongoDB transactions."
)
def get_spending_overview(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> SpendingOverviewResponse:
    """Aggregate real transactions into categories and timeline."""
    db = get_database()
    col = db.transactions
    user_id = current_user["_id"]

    # Category-wise expense breakdown
    cat_pipeline = [
        {"$match": {"user_id": user_id, "type": "expense"}},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"total": -1}},
    ]
    cat_results = list(col.aggregate(cat_pipeline))

    total_expense = sum(float(r["total"]) for r in cat_results)

    category_items: List[CategorySpendingItem] = []
    for r in cat_results:
        amt = float(r["total"])
        pct = round((amt / total_expense * 100.0), 1) if total_expense > 0 else 0.0
        category_items.append(
            CategorySpendingItem(
                category=r["_id"] or "Other",
                amount=round(amt, 2),
                percentage=pct,
                count=int(r["count"]),
            )
        )

    # Monthly cashflow timeline (group by date substring YYYY-MM)
    time_pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$project": {
                "month": {"$substr": ["$date", 0, 7]},
                "type": "$type",
                "amount": "$amount",
            }
        },
        {
            "$group": {
                "_id": {"month": "$month", "type": "$type"},
                "total": {"$sum": "$amount"},
            }
        },
        {"$sort": {"_id.month": 1}},
    ]
    time_results = list(col.aggregate(time_pipeline))

    month_map: Dict[str, Dict[str, float]] = {}
    total_income = 0.0

    for r in time_results:
        m = r["_id"]["month"]
        t = r["_id"]["type"]
        val = float(r["total"])

        if m not in month_map:
            month_map[m] = {"income": 0.0, "expense": 0.0}

        if t == "income":
            month_map[m]["income"] += val
            total_income += val
        elif t == "expense":
            month_map[m]["expense"] += val

    monthly_items: List[MonthlyCashflowItem] = []
    for m in sorted(month_map.keys()):
        inc = round(month_map[m]["income"], 2)
        exp = round(month_map[m]["expense"], 2)
        monthly_items.append(
            MonthlyCashflowItem(
                month=m,
                income=inc,
                expense=exp,
                net=round(inc - exp, 2),
            )
        )

    return SpendingOverviewResponse(
        categories=category_items,
        monthly_timeline=monthly_items,
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        net_cashflow=round(total_income - total_expense, 2),
    )


@router.get(
    "/score-history",
    response_model=List[Dict[str, Any]],
    summary="Historical Score Trend",
    description="Returns chronological health score snapshots for trend charting."
)
def get_score_history(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieve score history snapshots for the user."""
    db = get_database()
    cursor = db.score_history.find({"user_id": current_user["_id"]}).sort("recorded_at", 1).limit(30)
    return [score_history_helper(doc) for doc in cursor]


@router.get(
    "/dashboard",
    response_model=DashboardOverviewResponse,
    summary="Consolidated Authenticated Dashboard Data",
    description="Returns full dashboard payload using real MongoDB user and transaction records."
)
def get_dashboard_overview(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> DashboardOverviewResponse:
    """Single unified endpoint delivering verified metrics for the main financial dashboard."""
    user_id = current_user["_id"]
    profile = current_user.get("financial_profile") or {}

    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    savings = float(profile.get("current_savings", 0.0))
    emi = float(profile.get("monthly_emi", 0.0))
    investment = float(profile.get("monthly_investment", 0.0))

    # 1. Health Score Calculation & Snapshot
    health = calculate_financial_health(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        monthly_emi=emi,
        monthly_investment=investment,
    )
    record_score_history_snapshot(user_id, health)

    # 2. Emergency Fund Calculation
    emergency = calculate_emergency_fund(current_savings=savings, monthly_expenses=expenses)

    # 3. Spending Overview (Categories & Timeline)
    spending = get_spending_overview(current_user=current_user)

    # 4. Recent Transactions (last 5)
    recent_tx_list = get_transactions(user_id=user_id, page=1, limit=5)

    # 5. Budget Alerts Generation
    alerts: List[BudgetAlert] = []
    if income > 0 and (expenses / income) > 0.50:
        pct = round((expenses / income) * 100, 1)
        alerts.append(
            BudgetAlert(
                id="alert-expense-ratio",
                type="warning",
                title="50/30/20 Rule Deviation",
                message=f"Living expenses currently consume {pct}% of monthly inflow (exceeding recommended 50% target).",
            )
        )

    if income > 0 and (emi / income) > 0.35:
        dti_pct = round((emi / income) * 100, 1)
        alerts.append(
            BudgetAlert(
                id="alert-dti-high",
                type="danger",
                title="High Debt Burden Warning",
                message=f"Monthly EMI obligations consume {dti_pct}% of income. Keep below 35% to prevent cashflow stress.",
            )
        )

    if emergency.months_covered < 3.0 and expenses > 0:
        alerts.append(
            BudgetAlert(
                id="alert-emergency-low",
                type="danger",
                title="Liquidity Runway Alert",
                message=f"Your emergency cushion covers only {emergency.months_covered:.1f} months. Target at least 3 to 6 months.",
            )
        )

    if health.surplus < 0:
        alerts.append(
            BudgetAlert(
                id="alert-deficit",
                type="danger",
                title="Monthly Deficit Detected",
                message=f"Total monthly outflows exceed inflow by ₹{abs(health.surplus):,.2f}. Audit recurring subscriptions.",
            )
        )

    if investment == 0.0 and income > 0:
        alerts.append(
            BudgetAlert(
                id="alert-invest-zero",
                type="info",
                title="Wealth Growth Opportunity",
                message="Zero recurring investments recorded. Consider setting up a systematic investment plan (SIP) into index funds.",
            )
        )

    if not alerts:
        alerts.append(
            BudgetAlert(
                id="alert-all-good",
                type="success",
                title="All Systems Healthy",
                message="Your cashflow and liquidity metrics are operating within recommended optimal boundaries.",
            )
        )

    # 6. AI Insight Preview
    top_category = spending.categories[0].category if spending.categories else "Living Expenses"
    if health.health_score >= 80:
        insight_text = (
            f"Your financial vault exhibits exceptional strength ({health.health_score}/100) with a robust {health.savings_rate:.1f}% savings rate. "
            f"Your largest recent outflow is in {top_category}. Maintain your disciplined capital allocation."
        )
    elif health.health_score >= 60:
        insight_text = (
            f"Solid financial foundation ({health.health_score}/100). With a monthly surplus of ₹{health.surplus:,.2f}, "
            f"accelerating contributions toward your emergency fund (₹{emergency.amount_still_required:,.2f} required) will elevate you into the Prime tier."
        )
    else:
        insight_text = (
            f"Your financial health requires strategic optimization ({health.health_score}/100). "
            f"High expense pressure ({top_category}) is reducing cashflow flexibility. Focus on capping discretionary debits to build a 3-month survival reserve."
        )

    return DashboardOverviewResponse(
        user_name=current_user.get("name", "User"),
        user_city=current_user.get("city", "Local Vault"),
        user_age=int(current_user.get("age", 0)),
        summary_cards=SummaryCards(
            monthly_income=income,
            monthly_expenses=expenses,
            surplus=health.surplus,
            savings_rate=health.savings_rate,
            current_savings=savings,
            monthly_investment=investment,
            monthly_emi=emi,
        ),
        health_score=ScoreBrief(
            score=health.health_score,
            risk_level=health.risk_level,
            explanation=f"5-Pillar score based on {health.savings_rate:.1f}% savings rate, {health.emergency_fund_months:.1f} months runway, and {health.emi_burden_percentage:.1f}% DTI.",
        ),
        emergency_fund=emergency,
        spending_overview=spending,
        recent_transactions=recent_tx_list.items,
        budget_alerts=alerts,
        ai_insight=AIInsight(
            title="Strategic Financial Overview",
            content=insight_text,
            badge="Deterministic Preview (Gemini AI Ready)",
        ),
    )


@router.get(
    "/summary",
    response_model=CashflowSummaryResponse,
    summary="Consolidated Cashflow Summary",
    description="Combines profile baseline projections with actual recorded transaction totals."
)
def get_cashflow_summary(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> CashflowSummaryResponse:
    """Retrieve consolidated cashflow summary."""
    profile = current_user.get("financial_profile") or {}
    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    savings = float(profile.get("current_savings", 0.0))
    emi = float(profile.get("monthly_emi", 0.0))
    investment = float(profile.get("monthly_investment", 0.0))

    surplus = calculate_surplus(income, expenses)
    savings_rate = calculate_savings_rate(income, expenses)

    tx_list = get_transactions(user_id=current_user["_id"], limit=1)
    tx_summary = tx_list.summary

    return CashflowSummaryResponse(
        monthly_income=income,
        monthly_expenses=expenses,
        monthly_emi=emi,
        monthly_investment=investment,
        current_savings=savings,
        surplus=surplus,
        savings_rate=savings_rate,
        recorded_transactions_inflow=tx_summary.total_income,
        recorded_transactions_outflow=tx_summary.total_expense,
        net_recorded_balance=tx_summary.net_balance,
    )
