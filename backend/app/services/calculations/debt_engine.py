import math
from datetime import date
from typing import Any, Dict, List, Optional, Tuple


def _add_months_to_date(start_date: date, months: int) -> str:
    """Add a specified number of months to a calendar date and format as 'Month Year'."""
    new_year = start_date.year + (start_date.month + months - 1) // 12
    new_month = (start_date.month + months - 1) % 12 + 1
    d = date(new_year, new_month, 1)
    return d.strftime("%B %Y")


def _run_single_strategy_simulation(
    debts: List[Dict[str, Any]],
    strategy: str,
    monthly_budget: float,
    max_months: int = 360,
) -> Tuple[bool, int, float, float, Dict[str, int], Dict[str, float], List[Dict[str, Any]]]:
    """
    Simulates repayment under a specific strategy (avalanche or snowball).
    Returns:
    (is_completed, total_months, total_interest, total_paid, payoff_months, interest_per_debt, schedule)
    """
    if not debts:
        return True, 0, 0.0, 0.0, {}, {}, []

    # Filter out already settled debts
    active_debts = [
        {
            "id": str(d.get("id") or d.get("_id")),
            "name": d.get("debt_name", "Debt"),
            "balance": float(d.get("remaining_balance", 0.0)),
            "rate": float(d.get("interest_rate", 0.0)),
            "min_pay": float(d.get("minimum_payment", 0.0)),
        }
        for d in debts
        if float(d.get("remaining_balance", 0.0)) > 0
    ]

    if not active_debts:
        return True, 0, 0.0, 0.0, {}, {}, []

    # Priority sorting
    if strategy.lower() == "snowball":
        # Snowball: smallest remaining balance first
        priority_order = sorted(active_debts, key=lambda x: (x["balance"], -x["rate"]))
    else:
        # Avalanche: highest interest rate first
        priority_order = sorted(active_debts, key=lambda x: (-x["rate"], x["balance"]))

    balances: Dict[str, float] = {d["id"]: d["balance"] for d in priority_order}
    rates: Dict[str, float] = {d["id"]: d["rate"] for d in priority_order}
    min_pays: Dict[str, float] = {d["id"]: d["min_pay"] for d in priority_order}
    names: Dict[str, str] = {d["id"]: d["name"] for d in priority_order}

    total_interest_per_debt: Dict[str, float] = {d["id"]: 0.0 for d in priority_order}
    payoff_month_per_debt: Dict[str, int] = {d["id"]: 0 for d in priority_order}

    schedule: List[Dict[str, Any]] = []
    month = 0
    total_interest_paid = 0.0
    total_amount_paid = 0.0

    while month < max_months:
        active_ids = [d["id"] for d in priority_order if balances[d["id"]] > 0.01]
        if not active_ids:
            break

        month += 1
        month_interest = 0.0
        month_principal = 0.0
        month_payment = 0.0

        # 1. Accrue monthly interest for each active debt
        for debt_id in active_ids:
            monthly_rate = (rates[debt_id] / 100.0) / 12.0
            accrued = balances[debt_id] * monthly_rate
            balances[debt_id] += accrued
            month_interest += accrued
            total_interest_per_debt[debt_id] += accrued

        available_cash = monthly_budget

        # 2. Pay minimums first
        for debt_id in active_ids:
            due = min_pays[debt_id]
            pay = min(balances[debt_id], due, available_cash)
            balances[debt_id] -= pay
            available_cash -= pay
            month_payment += pay

            if balances[debt_id] <= 0.01 and payoff_month_per_debt[debt_id] == 0:
                balances[debt_id] = 0.0
                payoff_month_per_debt[debt_id] = month

        # 3. Allocate extra / rolled over cash to top priority active debt
        for d in priority_order:
            debt_id = d["id"]
            if balances[debt_id] > 0.01 and available_cash > 0:
                extra = min(balances[debt_id], available_cash)
                balances[debt_id] -= extra
                available_cash -= extra
                month_payment += extra

                if balances[debt_id] <= 0.01 and payoff_month_per_debt[debt_id] == 0:
                    balances[debt_id] = 0.0
                    payoff_month_per_debt[debt_id] = month

        total_interest_paid += month_interest
        total_amount_paid += month_payment
        remaining_total = sum(balances[d["id"]] for d in priority_order)
        month_principal = max(0.0, month_payment - month_interest)

        # Record schedule point (limit to every month if <= 60 months, or sampled if longer)
        schedule.append({
            "month": month,
            "remaining_total": round(remaining_total, 2),
            "interest_paid": round(month_interest, 2),
            "principal_paid": round(month_principal, 2),
            "payment_made": round(month_payment, 2),
            "debts_breakdown": {d["id"]: round(balances[d["id"]], 2) for d in priority_order},
        })

        if remaining_total <= 0.01:
            break

    is_completed = sum(balances[d["id"]] for d in priority_order) <= 0.01
    return (
        is_completed,
        month,
        round(total_interest_paid, 2),
        round(total_amount_paid, 2),
        payoff_month_per_debt,
        {k: round(v, 2) for k, v in total_interest_per_debt.items()},
        schedule,
    )


def calculate_debt_repayment_plan(
    debts: List[Dict[str, Any]],
    strategy: str = "avalanche",
    extra_monthly_payment: float = 0.0,
    reference_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Main deterministic debt repayment planner.
    Simulates chosen strategy (avalanche or snowball) and compares against the alternative.
    Validates minimum viable payment to prevent negative amortization.
    """
    today = reference_date or date.today()
    active_debts = [d for d in debts if float(d.get("remaining_balance", 0.0)) > 0]

    if not active_debts:
        return {
            "strategy": strategy.lower(),
            "monthly_budget": 0.0,
            "extra_monthly_payment": 0.0,
            "total_minimum_payments": 0.0,
            "months_to_debt_free": 0,
            "debt_free_date": today.strftime("%B %Y"),
            "total_interest_paid": 0.0,
            "total_amount_paid": 0.0,
            "is_viable": True,
            "warning_message": None,
            "minimum_viable_payment": 0.0,
            "per_debt_summary": [],
            "schedule": [],
            "comparison": {},
        }

    total_minimums = sum(float(d.get("minimum_payment", 0.0)) for d in active_debts)
    extra = max(0.0, float(extra_monthly_payment))
    monthly_budget = total_minimums + extra

    # Calculate initial monthly interest across all debts to check for negative amortization
    initial_monthly_interest = sum(
        float(d.get("remaining_balance", 0.0)) * ((float(d.get("interest_rate", 0.0)) / 100.0) / 12.0)
        for d in active_debts
    )
    min_viable_payment = round(initial_monthly_interest + 1.0, 2)

    warning_msg = None
    if monthly_budget <= initial_monthly_interest:
        warning_msg = (
            f"Monthly payment (₹{monthly_budget:,.2f}) does not cover monthly accrued interest "
            f"(₹{initial_monthly_interest:,.2f}/mo). Debt will grow indefinitely (negative amortization). "
            f"Allocate at least ₹{min_viable_payment:,.2f}/month."
        )

    # 1. Run simulation for chosen strategy
    chosen_strategy = strategy.lower()
    (
        is_viable,
        months,
        total_interest,
        total_paid,
        payoff_months,
        interest_per_debt,
        schedule,
    ) = _run_single_strategy_simulation(
        debts=active_debts,
        strategy=chosen_strategy,
        monthly_budget=monthly_budget,
    )

    if not is_viable and not warning_msg:
        warning_msg = "Payoff duration exceeds 30 years. Increase your monthly budget to achieve debt freedom."

    debt_free_date = _add_months_to_date(today, months) if is_viable else "Indefinite"

    # Per debt summaries
    per_debt_summary = []
    for d in active_debts:
        d_id = str(d.get("id") or d.get("_id"))
        per_debt_summary.append({
            "debt_id": d_id,
            "debt_name": d.get("debt_name", "Debt"),
            "payoff_month": payoff_months.get(d_id, 0),
            "total_interest_paid": interest_per_debt.get(d_id, 0.0),
        })

    # 2. Run simulation for alternative strategy for side-by-side comparison
    alt_strategy = "snowball" if chosen_strategy == "avalanche" else "avalanche"
    (
        alt_viable,
        alt_months,
        alt_interest,
        alt_paid,
        _,
        _,
        _,
    ) = _run_single_strategy_simulation(
        debts=active_debts,
        strategy=alt_strategy,
        monthly_budget=monthly_budget,
    )

    comparison = {
        chosen_strategy: {
            "strategy": chosen_strategy,
            "months_to_debt_free": months,
            "total_interest_paid": total_interest,
            "total_amount_paid": total_paid,
            "debt_free_date": debt_free_date,
        },
        alt_strategy: {
            "strategy": alt_strategy,
            "months_to_debt_free": alt_months,
            "total_interest_paid": alt_interest,
            "total_amount_paid": alt_paid,
            "debt_free_date": _add_months_to_date(today, alt_months) if alt_viable else "Indefinite",
        },
    }

    return {
        "strategy": chosen_strategy,
        "monthly_budget": round(monthly_budget, 2),
        "extra_monthly_payment": round(extra, 2),
        "total_minimum_payments": round(total_minimums, 2),
        "months_to_debt_free": months if is_viable else 999,
        "debt_free_date": debt_free_date,
        "total_interest_paid": total_interest,
        "total_amount_paid": total_paid,
        "is_viable": is_viable and (warning_msg is None or "negative amortization" not in warning_msg.lower()),
        "warning_message": warning_msg,
        "minimum_viable_payment": min_viable_payment,
        "per_debt_summary": per_debt_summary,
        "schedule": schedule,
        "comparison": comparison,
    }
