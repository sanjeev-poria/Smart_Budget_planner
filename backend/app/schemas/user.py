import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class FinancialProfileSchema(BaseModel):
    monthly_income: float = Field(default=0.0, ge=0.0, description="Monthly income in currency units (must be >= 0)")
    monthly_expenses: float = Field(default=0.0, ge=0.0, description="Monthly expenses in currency units (must be >= 0)")
    current_savings: float = Field(default=0.0, ge=0.0, description="Total current liquid savings (must be >= 0)")
    monthly_emi: float = Field(default=0.0, ge=0.0, description="Total monthly loan/debt payments (must be >= 0)")
    monthly_investment: float = Field(default=0.0, ge=0.0, description="Monthly investment allocation (must be >= 0)")
    tax_regime: str = Field(default="new", description="Tax regime: 'new' or 'old'")
    tax_deductions_80c: float = Field(default=0.0, ge=0.0, description="80C deductions (must be >= 0)")
    other_tax_deductions: float = Field(default=0.0, ge=0.0, description="Other tax exemptions/deductions (must be >= 0)")
    notes: Optional[str] = Field(default="", max_length=500, description="Financial goals or personal notes")


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars, 1 letter, 1 number)")
    age: int = Field(..., ge=18, le=120, description="Age in years (18 to 120)")
    city: str = Field(..., min_length=1, max_length=100, description="City of residence")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Password cannot be empty or whitespace only")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("name", "city")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or whitespace only")
        return stripped


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=120)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    monthly_income: Optional[float] = Field(None, ge=0.0, description="Monthly income >= 0")
    monthly_expenses: Optional[float] = Field(None, ge=0.0, description="Monthly expenses >= 0")
    current_savings: Optional[float] = Field(None, ge=0.0, description="Current savings >= 0")
    monthly_emi: Optional[float] = Field(None, ge=0.0, description="Monthly EMI >= 0")
    monthly_investment: Optional[float] = Field(None, ge=0.0, description="Monthly investment >= 0")
    tax_regime: Optional[str] = Field(None, description="Tax regime: 'new' or 'old'")
    tax_deductions_80c: Optional[float] = Field(None, ge=0.0, description="80C deductions >= 0")
    other_tax_deductions: Optional[float] = Field(None, ge=0.0, description="Other tax deductions >= 0")
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("tax_regime")
    @classmethod
    def validate_tax_regime(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ["new", "old"]:
            raise ValueError("Tax regime must be either 'new' or 'old'")
        return v.lower() if v else v


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    age: int
    city: str
    financial_profile: FinancialProfileSchema
    is_active: bool = True
    created_at: str
    updated_at: str
