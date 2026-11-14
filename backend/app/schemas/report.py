from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


REPORT_DISCLAIMER = (
    "This monthly financial report is compiled for educational and personal financial tracking purposes only, "
    "and does not constitute formal legal, accounting, tax, or investment advice."
)


class ReportGenerateRequest(BaseModel):
    month: Optional[int] = Field(None, ge=1, le=12, description="Target report month (1-12). Defaults to current month.")
    year: Optional[int] = Field(None, ge=2000, le=2100, description="Target report year. Defaults to current year.")


class ReportSummaryMetrics(BaseModel):
    income: float = 0.0
    expenses: float = 0.0
    surplus: float = 0.0
    savings_rate: float = 0.0
    health_score: int = 0
    risk_level: str = "Moderate"
    net_worth: float = 0.0
    emergency_months: float = 0.0


class MonthlyReportResponse(BaseModel):
    id: str
    user_id: str
    month: int
    year: int
    report_title: str
    file_name: str
    summary_metrics: Dict[str, Any] = Field(default_factory=dict)
    ai_insights_summary: Optional[str] = ""
    generated_at: str
    created_at: str
    updated_at: str


class ReportListResponse(BaseModel):
    reports: List[MonthlyReportResponse]
    total: int


class ReportPreviewResponse(BaseModel):
    month: int
    year: int
    report_title: str
    user_overview: Dict[str, Any]
    financial_summary: Dict[str, Any]
    financial_health_score: Dict[str, Any]
    spending_analysis: Dict[str, Any]
    emergency_fund: Dict[str, Any]
    goals: Dict[str, Any]
    investments: Dict[str, Any]
    debts: Dict[str, Any]
    net_worth: Dict[str, Any]
    budgets: Dict[str, Any]
    ai_insights: Dict[str, Any]
    disclaimer: str = REPORT_DISCLAIMER
