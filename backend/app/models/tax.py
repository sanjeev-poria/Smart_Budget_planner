from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def tax_investment_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB tax_investment document to client-safe dict."""
    if not doc:
        return {}

    return {
        "id": str(doc.get("_id")),
        "user_id": str(doc.get("user_id")),
        "financial_year": doc.get("financial_year", "2025-26"),
        "category": doc.get("category", "PPF"),
        "section": doc.get("section", "80C"),
        "name": doc.get("name", ""),
        "amount": float(doc.get("amount", 0.0)),
        "notes": doc.get("notes") or "",
        "created_at": doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": doc.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_tax_investment_document(
    user_id: ObjectId,
    financial_year: str,
    category: str,
    section: str,
    name: str,
    amount: float,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Construct a new tax investment document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "financial_year": financial_year.strip(),
        "category": category.strip(),
        "section": section.strip(),
        "name": name.strip(),
        "amount": round(float(amount), 2),
        "notes": (notes or "").strip(),
        "created_at": now,
        "updated_at": now,
    }
