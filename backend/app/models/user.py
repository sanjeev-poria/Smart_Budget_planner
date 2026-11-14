from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def user_helper(user: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB user document to client-safe response dict."""
    if not user:
        return {}

    user_id = str(user.get("_id")) if "_id" in user else None

    profile = user.get("financial_profile") or {}
    financial_profile = {
        "monthly_income": float(profile.get("monthly_income", 0.0)),
        "monthly_expenses": float(profile.get("monthly_expenses", 0.0)),
        "current_savings": float(profile.get("current_savings", 0.0)),
        "monthly_emi": float(profile.get("monthly_emi", 0.0)),
        "monthly_investment": float(profile.get("monthly_investment", 0.0)),
        "tax_regime": profile.get("tax_regime", "new"),
        "tax_deductions_80c": float(profile.get("tax_deductions_80c", 0.0)),
        "other_tax_deductions": float(profile.get("other_tax_deductions", 0.0)),
        "notes": profile.get("notes", ""),
    }

    return {
        "id": user_id,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "age": int(user.get("age", 0)),
        "city": user.get("city", ""),
        "financial_profile": financial_profile,
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": user.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_user_document(
    name: str,
    email: str,
    password_hash: str,
    age: int,
    city: str,
    financial_profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Construct a new user document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    default_profile = {
        "monthly_income": 0.0,
        "monthly_expenses": 0.0,
        "current_savings": 0.0,
        "monthly_emi": 0.0,
        "monthly_investment": 0.0,
        "tax_regime": "new",
        "tax_deductions_80c": 0.0,
        "other_tax_deductions": 0.0,
        "notes": "",
    }
    if financial_profile:
        default_profile.update(financial_profile)

    return {
        "name": name.strip(),
        "email": email.strip().lower(),
        "password_hash": password_hash,
        "age": age,
        "city": city.strip(),
        "financial_profile": default_profile,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
