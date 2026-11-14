from typing import Dict, List, Tuple, Any


def calculate_budget_metrics(
    monthly_limit: float,
    spending: float,
) -> Tuple[float, float, str]:
    """
    Deterministically computes:
    - budget_usage = category_spending / monthly_budget * 100
    - remaining_amount = monthly_budget - category_spending
    - status: 'Safe' (<80%), 'Warning' (80%-100%), 'Exceeded' (>100%)

    Guarantees zero divide-by-zero errors.
    """
    limit = max(0.0, float(monthly_limit))
    spent = max(0.0, float(spending))

    if limit <= 0.0:
        usage = 100.0 if spent > 0 else 0.0
        remaining = -spent
        status = "Exceeded" if spent > 0 else "Safe"
        return round(usage, 2), round(remaining, 2), status

    usage = round((spent / limit) * 100.0, 2)
    remaining = round(limit - spent, 2)

    if usage > 100.0:
        status = "Exceeded"
    elif usage >= 80.0:
        status = "Warning"
    else:
        status = "Safe"

    return usage, remaining, status


def calculate_budget_overview(
    budgets_with_spending: List[Dict[str, Any]],
    all_expenses_by_category: Dict[str, float],
    month: int,
    year: int,
) -> Dict[str, Any]:
    """
    Aggregates budget items, unbudgeted category spendings, and overall totals.
    """
    total_budgeted = 0.0
    total_spent_on_budgets = 0.0
    safe_count = 0
    warning_count = 0
    exceeded_count = 0

    processed_categories = set()
    budget_items = []

    for b in budgets_with_spending:
        category = b.get("category", "")
        limit = float(b.get("monthly_limit", 0.0))
        spent = float(all_expenses_by_category.get(category, 0.0))
        usage, remaining, status = calculate_budget_metrics(limit, spent)

        if status == "Safe":
            safe_count += 1
        elif status == "Warning":
            warning_count += 1
        else:
            exceeded_count += 1

        total_budgeted += limit
        total_spent_on_budgets += spent
        processed_categories.add(category)

        budget_items.append({
            "id": str(b.get("id") or b.get("_id")),
            "user_id": str(b.get("user_id")),
            "category": category,
            "monthly_limit": limit,
            "month": month,
            "year": year,
            "amount_spent": round(spent, 2),
            "remaining_amount": remaining,
            "budget_usage": usage,
            "status": status,
            "created_at": b.get("created_at", ""),
            "updated_at": b.get("updated_at", ""),
        })

    # Find unbudgeted categories where expenses were incurred
    unbudgeted_items = []
    total_unbudgeted_spent = 0.0

    for cat, amt in all_expenses_by_category.items():
        if cat not in processed_categories and amt > 0:
            unbudgeted_items.append({
                "category": cat,
                "amount_spent": round(amt, 2),
            })
            total_unbudgeted_spent += amt

    # Sort unbudgeted spending by highest first
    unbudgeted_items.sort(key=lambda x: x["amount_spent"], reverse=True)

    total_monthly_expense = round(total_spent_on_budgets + total_unbudgeted_spent, 2)
    total_budgeted = round(total_budgeted, 2)
    total_remaining = round(total_budgeted - total_spent_on_budgets, 2)

    overall_usage = (
        round((total_spent_on_budgets / total_budgeted) * 100.0, 2)
        if total_budgeted > 0
        else 0.0
    )

    return {
        "month": month,
        "year": year,
        "total_budgeted": total_budgeted,
        "total_spent": round(total_spent_on_budgets, 2),
        "total_remaining": total_remaining,
        "overall_usage_percentage": overall_usage,
        "safe_count": safe_count,
        "warning_count": warning_count,
        "exceeded_count": exceeded_count,
        "budgets": budget_items,
        "unbudgeted_spending": unbudgeted_items,
        "total_monthly_expense": total_monthly_expense,
    }
