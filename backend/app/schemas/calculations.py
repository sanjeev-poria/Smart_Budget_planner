from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PillarScore(BaseModel):
    name: str
    score: float
    max_score: float
    percentage: float
    status: str
    insight: str


class FinancialHealthResponse(BaseModel):
    health_score: int = Field(..., ge=0, le=100, description="Overall score clamped between 0 and 100")
    risk_level: str = Field(..., description="Risk categorization: Low Risk / Excellent, Medium Risk / Good, or High Risk / Needs Attention")
    surplus: float = Field(..., description="income - expenses")
    savings_rate: float = Field(..., description="surplus / income * 100 (safely 0.0 when income=0)")
    income: float
    expenses: float
    emergency_fund_months: float
    emi_burden_percentage: float
    investment_rate_percentage: float
    expense_ratio_percentage: float
    pillars: List[PillarScore]
    summary_recommendations: List[str]


class CashflowSummaryResponse(BaseModel):
    monthly_income: float
    monthly_expenses: float
    monthly_emi: float
    monthly_investment: float
    current_savings: float
    surplus: float
    savings_rate: float
    recorded_transactions_inflow: float
    recorded_transactions_outflow: float
    net_recorded_balance: float
