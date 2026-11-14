from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.asset import asset_helper, create_asset_document
from app.models.liability import liability_helper, create_liability_document
from app.schemas.net_worth import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetListResponse,
    LiabilityCreate,
    LiabilityUpdate,
    LiabilityResponse,
    LiabilityListResponse,
    CategoryBreakdownItem,
    NetWorthOverviewResponse,
)

# =============================================================================
# ASSETS SERVICE
# =============================================================================

def create_asset(user_id: ObjectId, asset_in: AssetCreate) -> AssetResponse:
    """Create a new asset record in MongoDB."""
    db = get_database()
    doc = create_asset_document(
        user_id=user_id,
        name=asset_in.name,
        category=asset_in.category,
        value=asset_in.value,
    )
    res = db.assets.insert_one(doc)
    doc["_id"] = res.inserted_id
    return AssetResponse(**asset_helper(doc))


def get_assets(user_id: ObjectId) -> AssetListResponse:
    """Retrieve all assets for authenticated user."""
    db = get_database()
    cursor = db.assets.find({"user_id": user_id}).sort("value", -1)

    items: List[AssetResponse] = []
    total_val = 0.0
    for doc in cursor:
        r = AssetResponse(**asset_helper(doc))
        items.append(r)
        total_val += r.value

    return AssetListResponse(
        items=items,
        total_value=round(total_val, 2),
        count=len(items),
    )


def get_asset_by_id(asset_id: str, user_id: ObjectId) -> Optional[AssetResponse]:
    """Retrieve single asset ensuring user ownership."""
    if not ObjectId.is_valid(asset_id):
        return None
    db = get_database()
    doc = db.assets.find_one({"_id": ObjectId(asset_id), "user_id": user_id})
    return AssetResponse(**asset_helper(doc)) if doc else None


def update_asset(asset_id: str, user_id: ObjectId, asset_in: AssetUpdate) -> Optional[AssetResponse]:
    """Update asset fields with user ownership verification."""
    if not ObjectId.is_valid(asset_id):
        return None
    db = get_database()
    existing = db.assets.find_one({"_id": ObjectId(asset_id), "user_id": user_id})
    if not existing:
        return None

    update_fields: Dict[str, Any] = {}
    if asset_in.name is not None:
        update_fields["name"] = asset_in.name.strip()
    if asset_in.category is not None:
        update_fields["category"] = asset_in.category.strip()
    if asset_in.value is not None:
        update_fields["value"] = max(0.0, float(asset_in.value))

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.assets.update_one(
        {"_id": ObjectId(asset_id), "user_id": user_id},
        {"$set": update_fields},
    )
    updated = db.assets.find_one({"_id": ObjectId(asset_id), "user_id": user_id})
    return AssetResponse(**asset_helper(updated))


def delete_asset(asset_id: str, user_id: ObjectId) -> bool:
    """Delete asset document ensuring ownership."""
    if not ObjectId.is_valid(asset_id):
        return False
    db = get_database()
    res = db.assets.delete_one({"_id": ObjectId(asset_id), "user_id": user_id})
    return res.deleted_count > 0


# =============================================================================
# LIABILITIES SERVICE
# =============================================================================

def create_liability(user_id: ObjectId, liability_in: LiabilityCreate) -> LiabilityResponse:
    """Create a new liability record in MongoDB."""
    db = get_database()
    doc = create_liability_document(
        user_id=user_id,
        name=liability_in.name,
        category=liability_in.category,
        value=liability_in.value,
    )
    res = db.liabilities.insert_one(doc)
    doc["_id"] = res.inserted_id
    return LiabilityResponse(**liability_helper(doc))


def get_liabilities(user_id: ObjectId) -> LiabilityListResponse:
    """Retrieve all liabilities for authenticated user."""
    db = get_database()
    cursor = db.liabilities.find({"user_id": user_id}).sort("value", -1)

    items: List[LiabilityResponse] = []
    total_val = 0.0
    for doc in cursor:
        r = LiabilityResponse(**liability_helper(doc))
        items.append(r)
        total_val += r.value

    return LiabilityListResponse(
        items=items,
        total_value=round(total_val, 2),
        count=len(items),
    )


def get_liability_by_id(liability_id: str, user_id: ObjectId) -> Optional[LiabilityResponse]:
    """Retrieve single liability ensuring user ownership."""
    if not ObjectId.is_valid(liability_id):
        return None
    db = get_database()
    doc = db.liabilities.find_one({"_id": ObjectId(liability_id), "user_id": user_id})
    return LiabilityResponse(**liability_helper(doc)) if doc else None


def update_liability(liability_id: str, user_id: ObjectId, liability_in: LiabilityUpdate) -> Optional[LiabilityResponse]:
    """Update liability fields with user ownership verification."""
    if not ObjectId.is_valid(liability_id):
        return None
    db = get_database()
    existing = db.liabilities.find_one({"_id": ObjectId(liability_id), "user_id": user_id})
    if not existing:
        return None

    update_fields: Dict[str, Any] = {}
    if liability_in.name is not None:
        update_fields["name"] = liability_in.name.strip()
    if liability_in.category is not None:
        update_fields["category"] = liability_in.category.strip()
    if liability_in.value is not None:
        update_fields["value"] = max(0.0, float(liability_in.value))

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.liabilities.update_one(
        {"_id": ObjectId(liability_id), "user_id": user_id},
        {"$set": update_fields},
    )
    updated = db.liabilities.find_one({"_id": ObjectId(liability_id), "user_id": user_id})
    return LiabilityResponse(**liability_helper(updated))


def delete_liability(liability_id: str, user_id: ObjectId) -> bool:
    """Delete liability document ensuring ownership."""
    if not ObjectId.is_valid(liability_id):
        return False
    db = get_database()
    res = db.liabilities.delete_one({"_id": ObjectId(liability_id), "user_id": user_id})
    return res.deleted_count > 0


# =============================================================================
# CONSOLIDATED NET WORTH CALCULATION
# =============================================================================

def get_net_worth_overview(user_id: ObjectId) -> NetWorthOverviewResponse:
    """
    Computes consolidated balance sheet:
    net_worth = total_assets - total_liabilities
    with category breakdown items for Recharts pie/donut charts.
    """
    db = get_database()
    asset_cursor = list(db.assets.find({"user_id": user_id}))
    liability_cursor = list(db.liabilities.find({"user_id": user_id}))

    total_assets = sum(float(a.get("value", 0.0)) for a in asset_cursor)
    total_liabilities = sum(float(l.get("value", 0.0)) for l in liability_cursor)
    net_worth = round(total_assets - total_liabilities, 2)

    # Ratios
    asset_to_debt = (
        round(total_assets / total_liabilities, 2)
        if total_liabilities > 0
        else (999.0 if total_assets > 0 else 0.0)
    )
    debt_to_asset = (
        round((total_liabilities / total_assets) * 100.0, 1)
        if total_assets > 0
        else 0.0
    )

    # Category breakdowns
    asset_groups: Dict[str, Dict[str, Any]] = {}
    for a in asset_cursor:
        cat = a.get("category", "Other")
        val = float(a.get("value", 0.0))
        if cat not in asset_groups:
            asset_groups[cat] = {"total": 0.0, "count": 0}
        asset_groups[cat]["total"] += val
        asset_groups[cat]["count"] += 1

    asset_breakdown: List[CategoryBreakdownItem] = []
    for cat, g in sorted(asset_groups.items(), key=lambda x: x[1]["total"], reverse=True):
        pct = round((g["total"] / total_assets) * 100.0, 1) if total_assets > 0 else 0.0
        asset_breakdown.append(
            CategoryBreakdownItem(
                category=cat,
                total_value=round(g["total"], 2),
                percentage=pct,
                count=g["count"],
            )
        )

    liability_groups: Dict[str, Dict[str, Any]] = {}
    for l in liability_cursor:
        cat = l.get("category", "Other")
        val = float(l.get("value", 0.0))
        if cat not in liability_groups:
            liability_groups[cat] = {"total": 0.0, "count": 0}
        liability_groups[cat]["total"] += val
        liability_groups[cat]["count"] += 1

    liability_breakdown: List[CategoryBreakdownItem] = []
    for cat, g in sorted(liability_groups.items(), key=lambda x: x[1]["total"], reverse=True):
        pct = round((g["total"] / total_liabilities) * 100.0, 1) if total_liabilities > 0 else 0.0
        liability_breakdown.append(
            CategoryBreakdownItem(
                category=cat,
                total_value=round(g["total"], 2),
                percentage=pct,
                count=g["count"],
            )
        )

    status = (
        "Positive Capital"
        if net_worth > 0
        else ("Balanced" if net_worth == 0 else "Net Deficit")
    )

    return NetWorthOverviewResponse(
        total_assets=round(total_assets, 2),
        total_liabilities=round(total_liabilities, 2),
        net_worth=net_worth,
        asset_to_liability_ratio=asset_to_debt,
        debt_to_asset_ratio=debt_to_asset,
        asset_breakdown=asset_breakdown,
        liability_breakdown=liability_breakdown,
        status=status,
    )
