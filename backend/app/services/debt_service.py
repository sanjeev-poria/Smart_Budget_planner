from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.debt import debt_helper, create_debt_document
from app.schemas.debt import (
    DebtCreate,
    DebtUpdate,
    DebtResponse,
    DebtSummary,
    DebtListResponse,
    DebtRepaymentPlanRequest,
    DebtRepaymentPlanResponse,
)
from app.services.calculations.debt_engine import calculate_debt_repayment_plan


def _format_debt_response(doc: Dict[str, Any]) -> DebtResponse:
    """Helper to convert MongoDB doc to DebtResponse with computed payoff_progress."""
    d = debt_helper(doc)
    principal = float(d["principal"])
    remaining = float(d["remaining_balance"])
    if principal > 0:
        progress = max(0.0, min(100.0, round(((principal - remaining) / principal) * 100.0, 1)))
    else:
        progress = 100.0 if remaining <= 0 else 0.0

    return DebtResponse(**d, payoff_progress=progress)


def create_debt(user_id: ObjectId, debt_in: DebtCreate) -> DebtResponse:
    """Create a new debt record in MongoDB."""
    db = get_database()
    doc = create_debt_document(
        user_id=user_id,
        debt_name=debt_in.debt_name,
        principal=debt_in.principal,
        remaining_balance=debt_in.remaining_balance,
        interest_rate=debt_in.interest_rate,
        minimum_payment=debt_in.minimum_payment,
        due_date=debt_in.due_date,
        category=debt_in.category,
    )
    res = db.debts.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _format_debt_response(doc)


def get_debts(user_id: ObjectId) -> DebtListResponse:
    """Retrieve all debts for a user with aggregate summary metrics."""
    db = get_database()
    cursor = db.debts.find({"user_id": user_id}).sort("remaining_balance", -1)

    items: List[DebtResponse] = []
    total_principal = 0.0
    total_remaining = 0.0
    total_min_pay = 0.0
    weighted_rate_sum = 0.0

    for doc in cursor:
        resp = _format_debt_response(doc)
        items.append(resp)
        total_principal += resp.principal
        total_remaining += resp.remaining_balance
        total_min_pay += resp.minimum_payment
        weighted_rate_sum += resp.remaining_balance * resp.interest_rate

    weighted_rate = (
        round(weighted_rate_sum / total_remaining, 2)
        if total_remaining > 0
        else 0.0
    )

    summary = DebtSummary(
        total_debts=len(items),
        total_principal=round(total_principal, 2),
        total_remaining_balance=round(total_remaining, 2),
        total_minimum_payment=round(total_min_pay, 2),
        weighted_average_interest_rate=weighted_rate,
    )

    return DebtListResponse(items=items, summary=summary)


def get_debt_by_id(debt_id: str, user_id: ObjectId) -> Optional[DebtResponse]:
    """Retrieve a single debt ensuring user ownership."""
    if not ObjectId.is_valid(debt_id):
        return None

    db = get_database()
    doc = db.debts.find_one({"_id": ObjectId(debt_id), "user_id": user_id})
    if not doc:
        return None
    return _format_debt_response(doc)


def update_debt(debt_id: str, user_id: ObjectId, debt_in: DebtUpdate) -> Optional[DebtResponse]:
    """Update debt parameters with user ownership validation."""
    if not ObjectId.is_valid(debt_id):
        return None

    db = get_database()
    existing = db.debts.find_one({"_id": ObjectId(debt_id), "user_id": user_id})
    if not existing:
        return None

    update_fields: Dict[str, Any] = {}
    if debt_in.debt_name is not None:
        update_fields["debt_name"] = debt_in.debt_name.strip()
    if debt_in.principal is not None:
        update_fields["principal"] = float(debt_in.principal)
    if debt_in.remaining_balance is not None:
        update_fields["remaining_balance"] = float(debt_in.remaining_balance)
    if debt_in.interest_rate is not None:
        update_fields["interest_rate"] = float(debt_in.interest_rate)
    if debt_in.minimum_payment is not None:
        update_fields["minimum_payment"] = float(debt_in.minimum_payment)
    if debt_in.due_date is not None:
        update_fields["due_date"] = debt_in.due_date.strip()
    if debt_in.category is not None:
        update_fields["category"] = debt_in.category.strip()

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.debts.update_one(
        {"_id": ObjectId(debt_id), "user_id": user_id},
        {"$set": update_fields},
    )

    updated = db.debts.find_one({"_id": ObjectId(debt_id), "user_id": user_id})
    return _format_debt_response(updated)


def delete_debt(debt_id: str, user_id: ObjectId) -> bool:
    """Delete a debt record ensuring user ownership."""
    if not ObjectId.is_valid(debt_id):
        return False

    db = get_database()
    res = db.debts.delete_one({"_id": ObjectId(debt_id), "user_id": user_id})
    return res.deleted_count > 0


def generate_user_repayment_plan(
    user_id: ObjectId,
    request: DebtRepaymentPlanRequest,
) -> DebtRepaymentPlanResponse:
    """Generate payoff plan using authenticated user's active debts from MongoDB."""
    db = get_database()
    cursor = list(db.debts.find({"user_id": user_id}))

    raw_debts = [debt_helper(doc) for doc in cursor]
    plan_dict = calculate_debt_repayment_plan(
        debts=raw_debts,
        strategy=request.strategy,
        extra_monthly_payment=request.extra_monthly_payment,
    )
    return DebtRepaymentPlanResponse(**plan_dict)
