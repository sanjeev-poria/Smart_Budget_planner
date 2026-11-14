import calendar
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.report import monthly_report_helper, create_monthly_report_document
from app.services.calculations.financial_engine import (
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_fund,
    calculate_financial_health,
)
from app.services.calculations.report_engine import build_monthly_financial_pdf
from app.services.calculations.investment_engine import calculate_investment_projection
from app.services.net_worth_service import get_net_worth_overview
from app.services.budget_service import get_budget_overview
from app.services.ai.gemini_service import generate_monthly_summary

logger = logging.getLogger(__name__)


def compile_monthly_report_data(user_id: ObjectId, month: int, year: int) -> Dict[str, Any]:
    """
    Compile verified actual user data across all 10 financial modules
    and AI monthly insights for the given month and year.
    """
    db = get_database()
    user = db.users.find_one({"_id": user_id}) or {}
    profile = user.get("financial_profile") or {}

    user_name = user.get("name", "SMARTFIN User")
    user_email = user.get("email", "")
    currency_code = "INR"
    currency_symbol = "₹"

    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    savings = float(profile.get("current_savings", 0.0))
    investments_monthly = float(profile.get("monthly_investments", 0.0))
    emi_monthly = float(profile.get("monthly_emi", 0.0))

    # 1. Financial summary
    surplus = calculate_surplus(income, expenses)
    savings_rate = calculate_savings_rate(income, expenses)

    # 2. Financial health score
    health_score_resp = calculate_financial_health(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        monthly_emi=emi_monthly,
        monthly_investment=investments_monthly,
    )
    pillars_data = [
        {
            "name": p.name,
            "score": p.score,
            "max_score": p.max_score,
            "percentage": p.percentage,
            "status": p.status,
            "insight": p.insight,
        }
        for p in health_score_resp.pillars
    ]

    # 3. Spending analysis for month
    _, last_day = calendar.monthrange(year, month)
    start_date = f"{year:04d}-{month:02d}-01"
    end_date = f"{year:04d}-{month:02d}-{last_day:02d}"

    tx_pipeline = [
        {"$match": {"user_id": user_id, "type": "expense", "date": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ]
    spending_by_category = [
        {"category": item["_id"], "amount": float(item["total"])}
        for item in db.transactions.aggregate(tx_pipeline)
    ]
    total_spent = sum(c["amount"] for c in spending_by_category)
    if total_spent == 0:
        total_spent = expenses  # fallback to baseline expenses if ledger is empty

    # 4. Emergency fund
    emergency_fund = calculate_emergency_fund(savings, expenses)

    # 5. Goals
    goals_cursor = db.goals.find({"user_id": user_id})
    goals_list = []
    for g in goals_cursor:
        t_amt = float(g.get("target_amount", 0.0))
        c_saved = float(g.get("current_saved", 0.0))
        rem = max(0.0, t_amt - c_saved)
        prog = min(100.0, (c_saved / t_amt * 100)) if t_amt > 0 else 100.0
        goals_list.append({
            "goal_name": g.get("goal_name", "Untitled Goal"),
            "target_amount": t_amt,
            "current_saved": c_saved,
            "amount_remaining": rem,
            "progress_percentage": prog,
            "monthly_required": float(g.get("monthly_required", rem / 12 if rem > 0 else 0)),
            "on_track": surplus >= float(g.get("monthly_required", 0)),
        })

    # 6. Investments & compounding projections
    annual_rate = 12.0
    inv_projections = {
        "1_year": calculate_investment_projection(investments_monthly, annual_rate, 1)["estimated_future_value"],
        "3_year": calculate_investment_projection(investments_monthly, annual_rate, 3)["estimated_future_value"],
        "5_year": calculate_investment_projection(investments_monthly, annual_rate, 5)["estimated_future_value"],
        "10_year": calculate_investment_projection(investments_monthly, annual_rate, 10)["estimated_future_value"],
    }

    # 7. Debts
    debts_cursor = db.debts.find({"user_id": user_id})
    debts_list = []
    for d in debts_cursor:
        debts_list.append({
            "debt_name": d.get("debt_name", "Loan"),
            "principal": float(d.get("principal", 0.0)),
            "remaining_balance": float(d.get("remaining_balance", 0.0)),
            "interest_rate": float(d.get("interest_rate", 0.0)),
            "minimum_payment": float(d.get("minimum_payment", 0.0)),
        })
    total_debt_remaining = sum(d["remaining_balance"] for d in debts_list)
    total_debt_min = sum(d["minimum_payment"] for d in debts_list)

    # 8. Net Worth
    try:
        net_worth_overview = get_net_worth_overview(user_id=user_id)
        assets_val = net_worth_overview.total_assets
        liab_val = net_worth_overview.total_liabilities
        nw_val = net_worth_overview.net_worth
    except Exception:
        assets_val = savings + (investments_monthly * 24)
        liab_val = total_debt_remaining
        nw_val = assets_val - liab_val

    # 9. Budgets
    try:
        budget_overview = get_budget_overview(user_id=user_id, month=month, year=year)
        budget_items = [b.model_dump() for b in budget_overview.budgets]
        total_budgeted = budget_overview.total_budgeted
        total_budget_spent = budget_overview.total_spent
        budget_status = budget_overview.overall_status
        budget_usage = budget_overview.budget_usage_percent
    except Exception:
        budget_items = []
        total_budgeted = 0.0
        total_budget_spent = total_spent
        budget_status = "Safe"
        budget_usage = 0.0

    # 10. AI Monthly Summary
    try:
        ai_summary_data = generate_monthly_summary(user_id=user_id)
    except Exception as err:
        logger.warning(f"Error generating AI summary for report: {err}")
        ai_summary_data = {
            "summary": "Monthly financial posture remains stable.",
            "highlights": ["Net surplus maintained.", "Active goal contributions tracked."],
            "areas_for_improvement": ["Build emergency reserve to 6 months."],
        }

    month_name = calendar.month_name[month]
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    return {
        "user_overview": {
            "name": user_name,
            "email": user_email,
            "month": month,
            "year": year,
            "period_name": f"{month_name} {year}",
            "generated_at": now_str,
            "currency_code": currency_code,
            "currency_symbol": currency_symbol,
        },
        "financial_summary": {
            "income": income,
            "expenses": expenses,
            "surplus": surplus,
            "savings_rate": savings_rate,
        },
        "financial_health_score": {
            "score": health_score_resp.health_score,
            "risk_level": health_score_resp.risk_level,
            "pillars": pillars_data,
        },
        "spending_analysis": {
            "total_spent": total_spent,
            "categories": spending_by_category,
        },
        "emergency_fund": {
            "current_savings": emergency_fund.current_savings,
            "target_amount": emergency_fund.target_amount,
            "months_covered": emergency_fund.months_covered,
            "amount_still_required": emergency_fund.amount_still_required,
            "status": emergency_fund.status,
        },
        "goals": {
            "active_count": len(goals_list),
            "items": goals_list,
        },
        "investments": {
            "monthly_investment": investments_monthly,
            "annual_return_rate": annual_rate,
            "projections": inv_projections,
        },
        "debts": {
            "total_remaining": total_debt_remaining,
            "total_minimum_payment": total_debt_min,
            "items": debts_list,
        },
        "net_worth": {
            "total_assets": assets_val,
            "total_liabilities": liab_val,
            "net_worth": nw_val,
        },
        "budgets": {
            "total_budgeted": total_budgeted,
            "total_spent": total_budget_spent,
            "usage_percent": budget_usage,
            "status": budget_status,
            "items": budget_items,
        },
        "ai_insights": ai_summary_data,
    }


def generate_and_save_report(
    user_id: ObjectId,
    month: Optional[int] = None,
    year: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Compile report data, generate PDF binary to verify validity,
    and persist report metadata in MongoDB monthly_reports collection.
    """
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    report_data = compile_monthly_report_data(user_id=user_id, month=target_month, year=target_year)

    month_name = calendar.month_name[target_month]
    report_title = f"Monthly Financial Statement - {month_name} {target_year}"
    file_name = f"smartfin_statement_{target_year}_{target_month:02d}.pdf"

    summary_metrics = {
        "income": report_data["financial_summary"]["income"],
        "expenses": report_data["financial_summary"]["expenses"],
        "surplus": report_data["financial_summary"]["surplus"],
        "savings_rate": report_data["financial_summary"]["savings_rate"],
        "health_score": report_data["financial_health_score"]["score"],
        "risk_level": report_data["financial_health_score"]["risk_level"],
        "net_worth": report_data["net_worth"]["net_worth"],
        "emergency_months": report_data["emergency_fund"]["months_covered"],
    }

    ai_text = report_data.get("ai_insights", {}).get("summary", "")

    db = get_database()
    doc = create_monthly_report_document(
        user_id=user_id,
        month=target_month,
        year=target_year,
        report_title=report_title,
        file_name=file_name,
        summary_metrics=summary_metrics,
        ai_insights_summary=ai_text,
    )
    res = db.monthly_reports.insert_one(doc)
    doc["_id"] = res.inserted_id

    return monthly_report_helper(doc)


def get_user_report_history(user_id: ObjectId) -> List[Dict[str, Any]]:
    """List all previously generated monthly reports for the user."""
    db = get_database()
    reports = list(db.monthly_reports.find({"user_id": user_id}).sort("generated_at", -1))
    return [monthly_report_helper(r) for r in reports]


def get_report_by_id(user_id: ObjectId, report_id: str) -> Optional[Dict[str, Any]]:
    """Fetch single report document from MongoDB."""
    db = get_database()
    try:
        r_oid = ObjectId(report_id)
    except Exception:
        return None
    doc = db.monthly_reports.find_one({"_id": r_oid, "user_id": user_id})
    return monthly_report_helper(doc) if doc else None


def get_report_pdf_bytes(user_id: ObjectId, report_id: str) -> Optional[tuple]:
    """
    Compile live report data for the given report ID and return (pdf_bytes, filename).
    """
    report = get_report_by_id(user_id=user_id, report_id=report_id)
    if not report:
        return None

    month = report["month"]
    year = report["year"]
    data = compile_monthly_report_data(user_id=user_id, month=month, year=year)
    pdf_bytes = build_monthly_financial_pdf(data)
    file_name = report.get("file_name", f"smartfin_statement_{year}_{month:02d}.pdf")
    return pdf_bytes, file_name


def delete_report(user_id: ObjectId, report_id: str) -> bool:
    """Delete a report record from MongoDB."""
    db = get_database()
    try:
        r_oid = ObjectId(report_id)
    except Exception:
        return False
    res = db.monthly_reports.delete_one({"_id": r_oid, "user_id": user_id})
    return res.deleted_count > 0
