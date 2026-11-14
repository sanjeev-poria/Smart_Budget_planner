from typing import List, Optional
from pydantic import BaseModel, Field


class InvestmentAssumptionsInput(BaseModel):
    monthly_investment: float = Field(
        default=5000.0,
        ge=0.0,
        description="Monthly recurring investment amount (₹)",
    )
    annual_return_rate: float = Field(
        default=12.0,
        ge=0.0,
        le=100.0,
        description="Expected annual rate of return (%)",
    )
    investment_period: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Investment horizon in years (1–50)",
    )
    inflation_rate: float = Field(
        default=6.0,
        ge=0.0,
        le=50.0,
        description="Expected annual inflation rate (%)",
    )
    initial_lumpsum: float = Field(
        default=0.0,
        ge=0.0,
        description="Initial one-time starting capital (₹)",
    )


class InvestmentTrajectoryPoint(BaseModel):
    year: int
    total_invested: float
    future_value: float
    inflation_adjusted_value: float
    estimated_gains: float


class InvestmentProjectionResponse(BaseModel):
    monthly_investment: float
    annual_return_rate: float
    investment_period: int
    inflation_rate: float
    initial_lumpsum: float
    total_invested: float
    estimated_future_value: float
    estimated_gains: float
    inflation_adjusted_value: float
    real_gains: float
    trajectory: List[InvestmentTrajectoryPoint]
    disclaimer: str


class InvestmentAssumptionsResponse(BaseModel):
    monthly_investment: float
    annual_return_rate: float
    investment_period: int
    inflation_rate: float
    initial_lumpsum: float
    updated_at: Optional[str] = None
