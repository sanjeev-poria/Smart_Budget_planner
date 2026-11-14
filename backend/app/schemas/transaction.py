from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


VALID_TRANSACTION_TYPES = ["income", "expense"]

STANDARD_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Rent",
    "Education",
    "Healthcare",
    "Entertainment",
    "Investment",
    "Salary",
    "Other",
]


class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0.0, description="Transaction amount (must be strictly greater than 0)")
    type: str = Field(..., description="Transaction type: 'income' or 'expense'")
    category: str = Field(..., min_length=1, max_length=50, description="Transaction category")
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    description: str = Field(..., min_length=1, max_length=255, description="Description or merchant name")

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in VALID_TRANSACTION_TYPES:
            raise ValueError(f"Type must be either 'income' or 'expense', got '{v}'")
        return clean

    @field_validator("category", "description")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Field cannot be empty or whitespace only")
        return clean

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        clean = v.strip()
        try:
            # Parse strict YYYY-MM-DD format
            datetime.strptime(clean, "%Y-%m-%d")
            return clean
        except ValueError:
            raise ValueError("Date must be in valid 'YYYY-MM-DD' calendar format")


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0.0, description="Transaction amount > 0")
    type: Optional[str] = Field(None, description="'income' or 'expense'")
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    description: Optional[str] = Field(None, min_length=1, max_length=255)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in VALID_TRANSACTION_TYPES:
                raise ValueError(f"Type must be either 'income' or 'expense', got '{v}'")
            return clean
        return v

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            try:
                datetime.strptime(clean, "%Y-%m-%d")
                return clean
            except ValueError:
                raise ValueError("Date must be in valid 'YYYY-MM-DD' calendar format")
        return v

    @field_validator("category", "description")
    @classmethod
    def validate_non_empty_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                raise ValueError("Field cannot be empty or whitespace only")
            return clean
        return v


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    type: str
    category: str
    date: str
    description: str
    created_at: str
    updated_at: str


class TransactionSummary(BaseModel):
    total_income: float = 0.0
    total_expense: float = 0.0
    net_balance: float = 0.0
    transaction_count: int = 0


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    summary: TransactionSummary
