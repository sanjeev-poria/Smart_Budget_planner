import math
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.transaction import transaction_helper, create_transaction_document
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    TransactionSummary,
)


def get_transactions_collection():
    return get_database().transactions


def create_transaction(user_id: ObjectId, data: TransactionCreate) -> TransactionResponse:
    """Create a new transaction for the authenticated user."""
    doc = create_transaction_document(
        user_id=user_id,
        amount=data.amount,
        type_=data.type,
        category=data.category,
        date=data.date,
        description=data.description,
    )
    col = get_transactions_collection()
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return TransactionResponse(**transaction_helper(doc))


def get_transactions(
    user_id: ObjectId,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    type_: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
) -> TransactionListResponse:
    """
    Retrieve paginated transactions with multi-criteria filtering, search, and summary totals.
    Guaranteed user isolation: only returns records matching user_id.
    """
    query: Dict[str, Any] = {"user_id": user_id}

    # Date range filtering
    date_filter: Dict[str, str] = {}
    if start_date:
        date_filter["$gte"] = start_date.strip()
    if end_date:
        date_filter["$lte"] = end_date.strip()
    if date_filter:
        query["date"] = date_filter

    # Category filter
    if category and category.strip().lower() != "all":
        query["category"] = category.strip()

    # Type filter (income or expense)
    if type_ and type_.strip().lower() != "all":
        query["type"] = type_.strip().lower()

    # Search filter (in description or category)
    if search and search.strip():
        term = re.escape(search.strip())
        query["$or"] = [
            {"description": {"$regex": term, "$options": "i"}},
            {"category": {"$regex": term, "$options": "i"}},
        ]

    col = get_transactions_collection()

    # Get total count matching query
    total = col.count_documents(query)
    total_pages = max(1, math.ceil(total / limit))
    skip = (page - 1) * limit

    # Fetch paginated items sorted by date descending, then created_at descending
    cursor = col.find(query).sort([("date", -1), ("created_at", -1)]).skip(skip).limit(limit)
    items = [TransactionResponse(**transaction_helper(doc)) for doc in cursor]

    # Calculate summary aggregates for this user (or within filtered scope)
    # Using aggregation pipeline
    summary_pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
    ]
    summary_results = list(col.aggregate(summary_pipeline))
    total_income = 0.0
    total_expense = 0.0

    for res in summary_results:
        if res["_id"] == "income":
            total_income = round(float(res.get("total", 0.0)), 2)
        elif res["_id"] == "expense":
            total_expense = round(float(res.get("total", 0.0)), 2)

    net_balance = round(total_income - total_expense, 2)

    summary = TransactionSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_balance=net_balance,
        transaction_count=total,
    )

    return TransactionListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        summary=summary,
    )


def get_transaction_by_id(user_id: ObjectId, transaction_id: str) -> Optional[TransactionResponse]:
    """Retrieve a single transaction ensuring user ownership."""
    try:
        obj_id = ObjectId(transaction_id)
    except Exception:
        return None

    col = get_transactions_collection()
    doc = col.find_one({"_id": obj_id, "user_id": user_id})
    if not doc:
        return None
    return TransactionResponse(**transaction_helper(doc))


def update_transaction(
    user_id: ObjectId, transaction_id: str, data: TransactionUpdate
) -> Optional[TransactionResponse]:
    """Update an existing transaction ensuring user ownership."""
    try:
        obj_id = ObjectId(transaction_id)
    except Exception:
        return None

    update_fields: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    if data.amount is not None:
        update_fields["amount"] = round(float(data.amount), 2)
    if data.type is not None:
        update_fields["type"] = data.type
    if data.category is not None:
        update_fields["category"] = data.category
    if data.date is not None:
        update_fields["date"] = data.date
    if data.description is not None:
        update_fields["description"] = data.description

    col = get_transactions_collection()
    res = col.update_one({"_id": obj_id, "user_id": user_id}, {"$set": update_fields})
    if res.matched_count == 0:
        return None

    updated_doc = col.find_one({"_id": obj_id, "user_id": user_id})
    if not updated_doc:
        return None
    return TransactionResponse(**transaction_helper(updated_doc))


def delete_transaction(user_id: ObjectId, transaction_id: str) -> bool:
    """Delete a transaction ensuring user ownership."""
    try:
        obj_id = ObjectId(transaction_id)
    except Exception:
        return False

    col = get_transactions_collection()
    res = col.delete_one({"_id": obj_id, "user_id": user_id})
    return res.deleted_count > 0
