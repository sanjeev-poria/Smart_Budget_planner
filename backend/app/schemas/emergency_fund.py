from pydantic import BaseModel, Field


class EmergencyFundResponse(BaseModel):
    target_amount: float = Field(..., description="Recommended emergency reserve: Monthly Expenses * 6")
    current_savings: float = Field(..., description="Current liquid savings")
    percentage_completed: float = Field(..., description="Percentage of target accumulated (0 to 100%)")
    months_covered: float = Field(..., description="Number of months of living expenses covered (safe when expenses=0)")
    amount_still_required: float = Field(..., description="Shortfall needed to reach the 6-month target")
    monthly_expenses: float = Field(..., description="Baseline monthly living expenses")
    status: str = Field(..., description="Liquidity tier: Optimal, Adequate, Vulnerable, or Critical")
    recommendation: str = Field(..., description="Actionable recommendation for emergency reserve")
