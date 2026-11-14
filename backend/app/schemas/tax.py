from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class TaxInvestmentCreate(BaseModel):
    financial_year: str = Field(default="2025-26", min_length=4, max_length=15, description="e.g. 2025-26")
    category: str = Field(..., min_length=1, max_length=50, description="e.g. PPF, ELSS, LIC, NSC, EPF")
    section: str = Field(default="80C", min_length=2, max_length=20, description="e.g. 80C, 80CCD(1B), 80D")
    name: str = Field(..., min_length=1, max_length=120, description="Description / Account name")
    amount: float = Field(..., gt=0, description="Eligible amount in INR")
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "category", "section")
    @classmethod
    def clean_text(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be blank")
        return s


class TaxInvestmentUpdate(BaseModel):
    financial_year: Optional[str] = Field(None, min_length=4, max_length=15)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    section: Optional[str] = Field(None, min_length=2, max_length=20)
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    amount: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=500)


class TaxInvestmentResponse(BaseModel):
    id: str
    user_id: str
    financial_year: str
    category: str
    section: str
    name: str
    amount: float
    notes: str
    created_at: str
    updated_at: str


class Tax80CSummary(BaseModel):
    total_eligible_80c: float
    cap_80c: float
    allowable_deduction_80c: float
    remaining_80c_limit: float
    utilization_percentage: float
    category_breakdown: Dict[str, float]


class RegimeTaxDetail(BaseModel):
    gross_income: float
    standard_deduction: float
    total_exemptions_deductions: float
    taxable_income: float
    base_tax: float
    rebate_87a: float
    cess: float
    total_tax_payable: float
    effective_tax_rate: float


class TaxRegimeComparison(BaseModel):
    financial_year: str
    gross_annual_income: float
    old_regime: RegimeTaxDetail
    new_regime: RegimeTaxDetail
    tax_difference: float
    recommended_regime: str
    savings_recommendation: str


class TaxOverviewResponse(BaseModel):
    financial_year: str
    gross_annual_income: float
    summary_80c: Tax80CSummary
    other_deductions: Dict[str, float]
    total_allowable_deductions: float
    investments: List[TaxInvestmentResponse]
    comparison: TaxRegimeComparison
    disclaimer: str
    supported_categories: List[Dict[str, Any]]


class TaxCompareRequest(BaseModel):
    annual_gross_income: float = Field(..., gt=0, description="Gross annual income in INR to simulate")
    financial_year: Optional[str] = Field("2025-26", min_length=4, max_length=15)
