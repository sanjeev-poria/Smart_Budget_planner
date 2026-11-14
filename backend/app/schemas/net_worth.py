from typing import List, Optional
from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the asset (e.g. Primary Residence, High-Yield Savings, EPF / PPF)")
    category: str = Field(default="Other", description="Asset category: Cash & Bank, Real Estate, Investments, Retirement, Vehicles, Crypto, Other")
    value: float = Field(..., ge=0, description="Estimated current fair market valuation (₹)")


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    value: Optional[float] = Field(None, ge=0)


class AssetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    value: float
    created_at: str
    updated_at: str


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total_value: float
    count: int


class LiabilityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the liability (e.g. Home Loan, Personal Loan)")
    category: str = Field(default="Other", description="Category: Mortgage, Vehicle Loan, Student Loan, Credit Card, Personal Loan, Other")
    value: float = Field(..., ge=0, description="Total outstanding debt balance or liability obligation (₹)")


class LiabilityCreate(LiabilityBase):
    pass


class LiabilityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    value: Optional[float] = Field(None, ge=0)


class LiabilityResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    value: float
    created_at: str
    updated_at: str


class LiabilityListResponse(BaseModel):
    items: List[LiabilityResponse]
    total_value: float
    count: int


class CategoryBreakdownItem(BaseModel):
    category: str
    total_value: float
    percentage: float
    count: int


class NetWorthOverviewResponse(BaseModel):
    total_assets: float
    total_liabilities: float
    net_worth: float
    asset_to_liability_ratio: float
    debt_to_asset_ratio: float
    asset_breakdown: List[CategoryBreakdownItem]
    liability_breakdown: List[CategoryBreakdownItem]
    status: str
