from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def monthly_report_helper(report: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB monthly_report document to client-safe response dict."""
    if not report:
        return {}

    return {
        "id": str(report.get("_id")),
        "user_id": str(report.get("user_id")),
        "month": int(report.get("month", 1)),
        "year": int(report.get("year", datetime.now(timezone.utc).year)),
        "report_title": report.get("report_title", "Monthly Financial Statement"),
        "file_name": report.get("file_name", "smartfin_report.pdf"),
        "summary_metrics": report.get("summary_metrics") or {},
        "ai_insights_summary": report.get("ai_insights_summary") or "",
        "generated_at": report.get("generated_at") or datetime.now(timezone.utc).isoformat(),
        "created_at": report.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": report.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_monthly_report_document(
    user_id: ObjectId,
    month: int,
    year: int,
    report_title: str,
    file_name: str,
    summary_metrics: Dict[str, Any],
    ai_insights_summary: Optional[str] = None,
) -> Dict[str, Any]:
    """Construct a new monthly_report document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "month": month,
        "year": year,
        "report_title": report_title.strip(),
        "file_name": file_name.strip(),
        "summary_metrics": summary_metrics or {},
        "ai_insights_summary": (ai_insights_summary or "").strip(),
        "generated_at": now,
        "created_at": now,
        "updated_at": now,
    }
