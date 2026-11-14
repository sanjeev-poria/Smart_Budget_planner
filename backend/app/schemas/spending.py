from typing import List
from pydantic import BaseModel, Field


class CategorySpendingItem(BaseModel):
    category: str
    amount: float
    percentage: float = Field(..., description="Percentage of total expenses")
    count: int


class MonthlyCashflowItem(BaseModel):
    month: str = Field(..., description="Month identifier (YYYY-MM or Mon YY)")
    income: float
    expense: float
    net: float


class SpendingOverviewResponse(BaseModel):
    categories: List[CategorySpendingItem]
    monthly_timeline: List[MonthlyCashflowItem]
    total_income: float
    total_expense: float
    net_cashflow: float
