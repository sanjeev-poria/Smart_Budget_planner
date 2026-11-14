from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class GoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=100, description="Name or title of the financial goal")
    target_amount: float = Field(..., gt=0, description="Target financial goal amount (must be positive)")
    current_saved: float = Field(default=0.0, ge=0, description="Currently saved capital toward this goal")
    target_date: str = Field(..., description="Target completion date in YYYY-MM-DD format")
    category: str = Field(default="Other", description="Goal category (e.g. Emergency, Retirement, Real Estate, Education, Vehicle, Travel, Wealth, Other)")
    description: Optional[str] = Field(default="", max_length=500, description="Optional notes or details")

    @field_validator("target_date")
    @classmethod
    def validate_target_date(cls, v: str) -> str:
        try:
            datetime.strptime(v.strip(), "%Y-%m-%d")
            return v.strip()
        except ValueError:
            raise ValueError("target_date must be in YYYY-MM-DD format")


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    goal_name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    current_saved: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("target_date")
    @classmethod
    def validate_target_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                datetime.strptime(v.strip(), "%Y-%m-%d")
                return v.strip()
            except ValueError:
                raise ValueError("target_date must be in YYYY-MM-DD format")
        return v


class GoalResponse(BaseModel):
    id: str
    user_id: str
    goal_name: str
    target_amount: float
    current_saved: float
    target_date: str
    category: str
    description: str
    created_at: str
    updated_at: str
    # Computed metrics
    progress_percentage: float = Field(..., description="Percentage of goal target currently funded (0–100%)")
    amount_remaining: float = Field(..., description="Remaining amount needed to complete goal")
    months_remaining: int = Field(..., description="Months until target date")
    monthly_required: float = Field(..., description="Required monthly savings to hit target on time")
    on_track: bool = Field(..., description="True if user monthly surplus >= monthly required")
    status: str = Field(..., description="completed, on_track, off_track, or overdue")
    user_monthly_surplus: float = Field(..., description="Authenticated user's baseline monthly cashflow surplus")


class GoalSummary(BaseModel):
    total_goals: int
    completed_goals: int
    on_track_goals: int
    off_track_goals: int
    total_target_amount: float
    total_current_saved: float
    overall_progress: float


class GoalListResponse(BaseModel):
    items: List[GoalResponse]
    summary: GoalSummary
