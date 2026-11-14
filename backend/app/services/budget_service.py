import calendar
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.budget import budget_helper, create_budget_document
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetItemResponse,
    BudgetOverviewResponse,
    CopyBudgetRequest,
)
from app.services.calculations.budget_engine import (
    calculate_budget_metrics,
    calculate_budget_overview,
)


def get_budgets_collection():
    return get_database().budgets


def get_transactions_collection():
    return get_database().transactions


def _get_category_expenses_for_period(
    user_id: ObjectId, month: int, year: int
) -> Dict[str, float]:
    """
    Query MongoDB transactions for expenses incurred by user in the given month and year.
    Returns mapping of category -> total amount spent.
    """
    _, last_day = calendar.monthrange(year, month)
    start_date = f"{year:04d}-{month:02d}-01"
    end_date = f"{year:04d}-{month:02d}-{last_day:02d}"

    query = {
        "user_id": user_id,
        "type": "expense",
        "date": {"$gte": start_date, "$lte": end_date},
    }

    transactions_cursor = get_transactions_collection().find(query)
    category_spending: Dict[str, float] = {}

    for tx in transactions_cursor:
        cat = tx.get("category", "Other")
        amt = float(tx.get("amount", 0.0))
        category_spending[cat] = category_spending.get(cat, 0.0) + amt

    return category_spending


def create_budget(user_id: ObjectId, data: BudgetCreate) -> BudgetItemResponse:
    """Create a new budget or update existing budget for (user_id, category, month, year)."""
    col = get_budgets_collection()
    clean_cat = data.category.strip()

    # Check if a budget already exists for this category/month/year
    existing = col.find_one({
        "user_id": user_id,
        "category": {"$regex": f"^{clean_cat}$", "$options": "i"},
        "month": data.month,
        "year": data.year,
    })

    now = datetime.now(timezone.utc).isoformat()
    if existing:
        col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "monthly_limit": round(data.monthly_limit, 2),
                    "category": clean_cat,
                    "updated_at": now,
                }
            },
        )
        existing["monthly_limit"] = round(data.monthly_limit, 2)
        existing["category"] = clean_cat
        existing["updated_at"] = now
        target_doc = existing
    else:
        new_doc = create_budget_document(
            user_id=user_id,
            category=clean_cat,
            monthly_limit=data.monthly_limit,
            month=data.month,
            year=data.year,
        )
        result = col.insert_one(new_doc)
        new_doc["_id"] = result.inserted_id
        target_doc = new_doc

    # Compute live spending & status
    expenses = _get_category_expenses_for_period(user_id, data.month, data.year)
    spent = expenses.get(target_doc["category"], 0.0)
    usage, remaining, status_label = calculate_budget_metrics(target_doc["monthly_limit"], spent)

    return BudgetItemResponse(
        id=str(target_doc["_id"]),
        user_id=str(user_id),
        category=target_doc["category"],
        monthly_limit=target_doc["monthly_limit"],
        month=target_doc["month"],
        year=target_doc["year"],
        amount_spent=round(spent, 2),
        remaining_amount=remaining,
        budget_usage=usage,
        status=status_label,
        created_at=target_doc.get("created_at", now),
        updated_at=target_doc.get("updated_at", now),
    )


def get_budget_overview(
    user_id: ObjectId, month: int, year: int
) -> BudgetOverviewResponse:
    """
    Retrieve full budget overview with category spending, adherence metrics, and unbudgeted warnings.
    """
    col = get_budgets_collection()
    budgets_cursor = col.find({"user_id": user_id, "month": month, "year": year})
    budgets_list = list(budgets_cursor)

    expenses = _get_category_expenses_for_period(user_id, month, year)
    overview_dict = calculate_budget_overview(budgets_list, expenses, month, year)

    return BudgetOverviewResponse(**overview_dict)


def get_budget_by_id(user_id: ObjectId, budget_id: str) -> BudgetItemResponse:
    """Fetch single budget item with live spending calculation."""
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget ID format")

    doc = get_budgets_collection().find_one({"_id": ObjectId(budget_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    expenses = _get_category_expenses_for_period(user_id, doc["month"], doc["year"])
    spent = expenses.get(doc["category"], 0.0)
    usage, remaining, status_label = calculate_budget_metrics(doc["monthly_limit"], spent)

    return BudgetItemResponse(
        id=str(doc["_id"]),
        user_id=str(user_id),
        category=doc["category"],
        monthly_limit=doc["monthly_limit"],
        month=doc["month"],
        year=doc["year"],
        amount_spent=round(spent, 2),
        remaining_amount=remaining,
        budget_usage=usage,
        status=status_label,
        created_at=doc.get("created_at", ""),
        updated_at=doc.get("updated_at", ""),
    )


def update_budget(user_id: ObjectId, budget_id: str, data: BudgetUpdate) -> BudgetItemResponse:
    """Update category and/or monthly limit of an existing budget."""
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget ID format")

    col = get_budgets_collection()
    doc = col.find_one({"_id": ObjectId(budget_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.monthly_limit is not None:
        update_fields["monthly_limit"] = round(float(data.monthly_limit), 2)
    if data.category is not None:
        clean_cat = data.category.strip()
        if not clean_cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be empty")
        # Check collision with existing budget
        duplicate = col.find_one({
            "user_id": user_id,
            "category": {"$regex": f"^{clean_cat}$", "$options": "i"},
            "month": doc["month"],
            "year": doc["year"],
            "_id": {"$ne": ObjectId(budget_id)},
        })
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A budget for category '{clean_cat}' already exists in {doc['month']}/{doc['year']}",
            )
        update_fields["category"] = clean_cat

    col.update_one({"_id": ObjectId(budget_id)}, {"$set": update_fields})
    updated_doc = col.find_one({"_id": ObjectId(budget_id)})

    expenses = _get_category_expenses_for_period(user_id, updated_doc["month"], updated_doc["year"])
    spent = expenses.get(updated_doc["category"], 0.0)
    usage, remaining, status_label = calculate_budget_metrics(updated_doc["monthly_limit"], spent)

    return BudgetItemResponse(
        id=str(updated_doc["_id"]),
        user_id=str(user_id),
        category=updated_doc["category"],
        monthly_limit=updated_doc["monthly_limit"],
        month=updated_doc["month"],
        year=updated_doc["year"],
        amount_spent=round(spent, 2),
        remaining_amount=remaining,
        budget_usage=usage,
        status=status_label,
        created_at=updated_doc.get("created_at", ""),
        updated_at=updated_doc.get("updated_at", ""),
    )


def delete_budget(user_id: ObjectId, budget_id: str) -> Dict[str, Any]:
    """Delete a budget item."""
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget ID format")

    col = get_budgets_collection()
    result = col.delete_one({"_id": ObjectId(budget_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    return {"message": "Budget successfully deleted", "id": budget_id}


def copy_previous_month_budgets(user_id: ObjectId, req: CopyBudgetRequest) -> Dict[str, Any]:
    """
    Copies budget categories and limits from source month/year to target month/year.
    Skips categories that already exist in target month to avoid overwriting.
    """
    col = get_budgets_collection()
    source_budgets = list(col.find({
        "user_id": user_id,
        "month": req.source_month,
        "year": req.source_year,
    }))

    if not source_budgets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No budgets found for source period {req.source_month}/{req.source_year}",
        )

    # Fetch existing categories in target month
    target_budgets = list(col.find({
        "user_id": user_id,
        "month": req.target_month,
        "year": req.target_year,
    }))
    existing_categories = {b.get("category", "").lower() for b in target_budgets}

    copied_count = 0
    now = datetime.now(timezone.utc).isoformat()
    for sb in source_budgets:
        cat = sb.get("category", "")
        if cat.lower() not in existing_categories:
            new_doc = {
                "user_id": user_id,
                "category": cat,
                "monthly_limit": float(sb.get("monthly_limit", 0.0)),
                "month": req.target_month,
                "year": req.target_year,
                "created_at": now,
                "updated_at": now,
            }
            col.insert_one(new_doc)
            existing_categories.add(cat.lower())
            copied_count += 1

    return {
        "message": f"Successfully copied {copied_count} budget(s) to {req.target_month}/{req.target_year}",
        "copied_count": copied_count,
    }
