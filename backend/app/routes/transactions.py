from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_user
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new transaction",
    description="Creates an income or expense transaction linked to the authenticated user."
)
def create_new_transaction(
    tx_in: TransactionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> TransactionResponse:
    """Create a new transaction."""
    user_id = current_user["_id"]
    return transaction_service.create_transaction(user_id=user_id, data=tx_in)


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List transactions with filters and pagination",
    description="Returns filtered and paginated transactions for the current user along with running totals."
)
def list_transactions(
    start_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by category or 'all'"),
    type: Optional[str] = Query(None, description="Filter by 'income', 'expense', or 'all'"),
    search: Optional[str] = Query(None, description="Search description or category"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page (max 100)"),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> TransactionListResponse:
    """List transactions with filtering and pagination."""
    user_id = current_user["_id"]
    return transaction_service.get_transactions(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        category=category,
        type_=type,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get transaction by ID",
    description="Retrieves a single transaction by ID, strictly verifying user ownership."
)
def get_transaction(
    transaction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> TransactionResponse:
    """Get single transaction."""
    user_id = current_user["_id"]
    tx = transaction_service.get_transaction_by_id(user_id=user_id, transaction_id=transaction_id)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or access denied.",
        )
    return tx


@router.put(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Update transaction",
    description="Updates transaction fields, strictly verifying user ownership."
)
def update_transaction(
    transaction_id: str,
    tx_in: TransactionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> TransactionResponse:
    """Update existing transaction."""
    user_id = current_user["_id"]
    tx = transaction_service.update_transaction(
        user_id=user_id, transaction_id=transaction_id, data=tx_in
    )
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or access denied.",
        )
    return tx


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete transaction",
    description="Deletes a transaction, strictly verifying user ownership."
)
def delete_transaction(
    transaction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a transaction."""
    user_id = current_user["_id"]
    success = transaction_service.delete_transaction(user_id=user_id, transaction_id=transaction_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or access denied.",
        )
    return {"status": "success", "message": "Transaction deleted successfully"}
