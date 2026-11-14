from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=100, description="Expense category name")
    monthly_limit: float = Field(..., gt=0, description="Monthly spending limit allocated for this category")
    month: int = Field(..., ge=1, le=12, description="Target month (1-12)")
    year: int = Field(..., ge=2000, le=2100, description="Target calendar year (e.g. 2026)")

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Category cannot be blank")
        return s


class BudgetUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    monthly_limit: Optional[float] = Field(None, gt=0)


class BudgetItemResponse(BaseModel):
    id: str
    user_id: str
    category: str
    monthly_limit: float
    month: int
    year: int
    amount_spent: float
    remaining_amount: float
    budget_usage: float
    status: str  # Safe, Warning, Exceeded
    created_at: str
    updated_at: str


class UnbudgetedCategorySpending(BaseModel):
    category: str
    amount_spent: float


class BudgetOverviewResponse(BaseModel):
    month: int
    year: int
    total_budgeted: float
    total_spent: float
    total_remaining: float
    overall_usage_percentage: float
    safe_count: int
    warning_count: int
    exceeded_count: int
    budgets: List[BudgetItemResponse]
    unbudgeted_spending: List[UnbudgetedCategorySpending]
    total_monthly_expense: float


class CopyBudgetRequest(BaseModel):
    source_month: int = Field(..., ge=1, le=12)
    source_year: int = Field(..., ge=2000, le=2100)
    target_month: int = Field(..., ge=1, le=12)
    target_year: int = Field(..., ge=2000, le=2100)
