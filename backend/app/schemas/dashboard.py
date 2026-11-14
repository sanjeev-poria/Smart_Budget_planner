from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.calculations import FinancialHealthResponse
from app.schemas.emergency_fund import EmergencyFundResponse
from app.schemas.spending import SpendingOverviewResponse
from app.schemas.transaction import TransactionResponse


class SummaryCards(BaseModel):
    monthly_income: float
    monthly_expenses: float
    surplus: float
    savings_rate: float
    current_savings: float
    monthly_investment: float
    monthly_emi: float


class ScoreBrief(BaseModel):
    score: int
    risk_level: str
    explanation: str


class BudgetAlert(BaseModel):
    id: str
    type: str = Field(..., description="'warning', 'danger', 'info', or 'success'")
    title: str
    message: str


class AIInsight(BaseModel):
    title: str
    content: str
    badge: str = "Deterministic Preview (Gemini AI Ready)"


class DashboardOverviewResponse(BaseModel):
    user_name: str
    user_city: str
    user_age: int
    summary_cards: SummaryCards
    health_score: ScoreBrief
    emergency_fund: EmergencyFundResponse
    spending_overview: SpendingOverviewResponse
    recent_transactions: List[TransactionResponse]
    budget_alerts: List[BudgetAlert]
    ai_insight: AIInsight
