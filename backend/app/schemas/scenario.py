from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ScenarioInputs(BaseModel):
    monthly_income: Optional[float] = Field(None, ge=0, description="Hypothetical monthly income")
    monthly_expenses: Optional[float] = Field(None, ge=0, description="Hypothetical monthly expenses")
    monthly_savings: Optional[float] = Field(None, ge=0, description="Hypothetical monthly savings allocation")
    monthly_emi: Optional[float] = Field(None, ge=0, description="Hypothetical monthly EMI liabilities")
    monthly_investment: Optional[float] = Field(None, ge=0, description="Hypothetical monthly SIP investment")
    current_savings: Optional[float] = Field(None, ge=0, description="Hypothetical liquid savings reserve")
    investment_return_rate: Optional[float] = Field(None, ge=0, le=100, description="Expected annual return rate (%)")
    debt_payment: Optional[float] = Field(None, ge=0, description="Total monthly debt allocation")
    target_goal_contribution: Optional[float] = Field(None, ge=0, description="Dedicated monthly goal allocation")


class ScenarioCreate(BaseModel):
    scenario_name: str = Field(..., min_length=1, max_length=120, description="Descriptive scenario name")
    description: Optional[str] = Field(None, max_length=500)
    inputs: ScenarioInputs

    @field_validator("scenario_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Scenario name cannot be blank")
        return s


class ScenarioUpdate(BaseModel):
    scenario_name: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    inputs: Optional[ScenarioInputs] = None


class ScenarioResponse(BaseModel):
    id: str
    user_id: str
    scenario_name: str
    description: str
    inputs: Dict[str, Any]
    created_at: str
    updated_at: str


class MetricComparison(BaseModel):
    baseline: float
    what_if: float
    delta: float
    delta_percent: float
    is_improvement: bool


class PillarComparison(BaseModel):
    name: str
    baseline_score: float
    whatif_score: float
    delta: float
    max_score: float
    baseline_status: str
    whatif_status: str


class WealthTrajectoryPoint(BaseModel):
    year: int
    baseline_wealth: float
    whatif_wealth: float
    wealth_delta: float


class GoalImpactItem(BaseModel):
    goal_id: str
    goal_name: str
    target_amount: float
    current_saved: float
    target_date: str
    monthly_required: float
    baseline_on_track: bool
    whatif_on_track: bool
    months_saved: int


class NetFinancialImpact(BaseModel):
    annual_cashflow_delta: float
    health_score_delta: int
    runway_delta_months: float
    wealth_10y_delta: float
    rating: str  # "Highly Positive", "Moderately Positive", "Neutral", "Cautionary / Cashflow Strain", "Critical Outflow Risk"
    headline: str
    takeaways: List[str]


class WhatIfSimulationResponse(BaseModel):
    baseline_profile: Dict[str, Any]
    simulated_inputs: Dict[str, Any]
    metrics: Dict[str, MetricComparison]
    pillar_breakdown: List[PillarComparison]
    wealth_trajectory: List[WealthTrajectoryPoint]
    goals_impact: List[GoalImpactItem]
    net_financial_impact: NetFinancialImpact
