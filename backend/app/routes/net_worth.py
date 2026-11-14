from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.deps import get_current_user
from app.schemas.net_worth import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetListResponse,
    LiabilityCreate,
    LiabilityUpdate,
    LiabilityResponse,
    LiabilityListResponse,
    NetWorthOverviewResponse,
)
from app.services.net_worth_service import (
    create_asset,
    get_assets,
    get_asset_by_id,
    update_asset,
    delete_asset,
    create_liability,
    get_liabilities,
    get_liability_by_id,
    update_liability,
    delete_liability,
    get_net_worth_overview,
)

router = APIRouter(prefix="/net-worth", tags=["Assets, Liabilities & Net Worth"])


@router.get(
    "",
    response_model=NetWorthOverviewResponse,
    summary="Consolidated Balance Sheet & Net Worth",
    description="Calculates Net Worth = Total Assets - Total Liabilities with asset/liability category distributions."
)
def get_net_worth(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> NetWorthOverviewResponse:
    """Retrieve full balance sheet overview for authenticated user."""
    return get_net_worth_overview(user_id=current_user["_id"])


# =============================================================================
# ASSETS ENDPOINTS
# =============================================================================

@router.get("/assets", response_model=AssetListResponse, summary="List User Assets")
def list_assets(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> AssetListResponse:
    return get_assets(user_id=current_user["_id"])


@router.post(
    "/assets",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Asset"
)
def add_asset(
    asset_in: AssetCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> AssetResponse:
    return create_asset(user_id=current_user["_id"], asset_in=asset_in)


@router.get("/assets/{asset_id}", response_model=AssetResponse, summary="Get Single Asset")
def get_single_asset(
    asset_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> AssetResponse:
    asset = get_asset_by_id(asset_id=asset_id, user_id=current_user["_id"])
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.put("/assets/{asset_id}", response_model=AssetResponse, summary="Update Asset")
def modify_asset(
    asset_id: str,
    asset_in: AssetUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> AssetResponse:
    updated = update_asset(asset_id=asset_id, user_id=current_user["_id"], asset_in=asset_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return updated


@router.delete("/assets/{asset_id}", status_code=status.HTTP_200_OK, summary="Delete Asset")
def remove_asset(
    asset_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    success = delete_asset(asset_id=asset_id, user_id=current_user["_id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return {"message": "Asset deleted successfully", "id": asset_id}


# =============================================================================
# LIABILITIES ENDPOINTS
# =============================================================================

@router.get("/liabilities", response_model=LiabilityListResponse, summary="List User Liabilities")
def list_liabilities(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> LiabilityListResponse:
    return get_liabilities(user_id=current_user["_id"])


@router.post(
    "/liabilities",
    response_model=LiabilityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Liability"
)
def add_liability(
    liability_in: LiabilityCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> LiabilityResponse:
    return create_liability(user_id=current_user["_id"], liability_in=liability_in)


@router.get("/liabilities/{liability_id}", response_model=LiabilityResponse, summary="Get Single Liability")
def get_single_liability(
    liability_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> LiabilityResponse:
    liability = get_liability_by_id(liability_id=liability_id, user_id=current_user["_id"])
    if not liability:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Liability not found")
    return liability


@router.put("/liabilities/{liability_id}", response_model=LiabilityResponse, summary="Update Liability")
def modify_liability(
    liability_id: str,
    liability_in: LiabilityUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> LiabilityResponse:
    updated = update_liability(liability_id=liability_id, user_id=current_user["_id"], liability_in=liability_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Liability not found")
    return updated


@router.delete("/liabilities/{liability_id}", status_code=status.HTTP_200_OK, summary="Delete Liability")
def remove_liability(
    liability_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    success = delete_liability(liability_id=liability_id, user_id=current_user["_id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Liability not found")
    return {"message": "Liability deleted successfully", "id": liability_id}
