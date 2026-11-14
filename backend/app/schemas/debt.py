from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DebtBase(BaseModel):
    debt_name: str = Field(..., min_length=1, max_length=100, description="Name or title of the liability (e.g. Chase Sapphire, Auto Loan)")
    principal: float = Field(..., gt=0, description="Original borrowed loan amount or principal (₹)")
    remaining_balance: float = Field(..., ge=0, description="Current outstanding balance (₹)")
    interest_rate: float = Field(..., ge=0, le=100, description="Annual percentage interest rate (%)")
    minimum_payment: float = Field(..., gt=0, description="Mandatory minimum monthly payment (₹)")
    due_date: str = Field(default="1st", description="Day of the month due or due date string")
    category: str = Field(default="Credit Card", description="Category: Credit Card, Personal Loan, Student Loan, Auto Loan, Mortgage, Medical, Other")


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    debt_name: Optional[str] = Field(None, min_length=1, max_length=100)
    principal: Optional[float] = Field(None, gt=0)
    remaining_balance: Optional[float] = Field(None, ge=0)
    interest_rate: Optional[float] = Field(None, ge=0, le=100)
    minimum_payment: Optional[float] = Field(None, gt=0)
    due_date: Optional[str] = None
    category: Optional[str] = None


class DebtResponse(BaseModel):
    id: str
    user_id: str
    debt_name: str
    principal: float
    remaining_balance: float
    interest_rate: float
    minimum_payment: float
    due_date: str
    category: str
    created_at: str
    updated_at: str
    payoff_progress: float = Field(..., description="Percentage of principal cleared (0–100%)")


class DebtSummary(BaseModel):
    total_debts: int
    total_principal: float
    total_remaining_balance: float
    total_minimum_payment: float
    weighted_average_interest_rate: float


class DebtListResponse(BaseModel):
    items: List[DebtResponse]
    summary: DebtSummary


class DebtRepaymentPlanRequest(BaseModel):
    strategy: str = Field(
        default="avalanche",
        description="Repayment prioritization strategy: 'avalanche' (highest interest rate first) or 'snowball' (lowest balance first)",
    )
    extra_monthly_payment: float = Field(
        default=0.0,
        ge=0.0,
        description="Optional additional monthly cash allocated above total minimum payments (₹)",
    )


class DebtPayoffScheduleItem(BaseModel):
    month: int
    remaining_total: float
    interest_paid: float
    principal_paid: float
    payment_made: float
    debts_breakdown: Dict[str, float]


class DebtPayoffPerDebtSummary(BaseModel):
    debt_id: str
    debt_name: str
    payoff_month: int
    total_interest_paid: float


class DebtComparisonStrategy(BaseModel):
    strategy: str
    months_to_debt_free: int
    total_interest_paid: float
    total_amount_paid: float
    debt_free_date: str


class DebtRepaymentPlanResponse(BaseModel):
    strategy: str
    monthly_budget: float
    extra_monthly_payment: float
    total_minimum_payments: float
    months_to_debt_free: int
    debt_free_date: str
    total_interest_paid: float
    total_amount_paid: float
    is_viable: bool
    warning_message: Optional[str] = None
    minimum_viable_payment: float
    per_debt_summary: List[DebtPayoffPerDebtSummary]
    schedule: List[DebtPayoffScheduleItem]
    comparison: Dict[str, DebtComparisonStrategy]
