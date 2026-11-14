from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.deps import get_current_user
from app.schemas.report import (
    ReportGenerateRequest,
    MonthlyReportResponse,
    ReportListResponse,
    ReportPreviewResponse,
    REPORT_DISCLAIMER,
)
from app.services.report_service import (
    compile_monthly_report_data,
    generate_and_save_report,
    get_user_report_history,
    get_report_by_id,
    get_report_pdf_bytes,
    delete_report,
)

router = APIRouter(prefix="/reports", tags=["Monthly Financial Reports"])


@router.post(
    "/generate",
    response_model=MonthlyReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate monthly report from actual user data and save metadata",
)
def generate_report_endpoint(
    req: ReportGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Compiles actual data across all 10 financial modules + AI monthly insights,
    generates verified statement, and saves report metadata in MongoDB monthly_reports collection.
    """
    report = generate_and_save_report(
        user_id=current_user["_id"],
        month=req.month,
        year=req.year,
    )
    return report


@router.get(
    "/history",
    response_model=ReportListResponse,
    summary="View report history for authenticated user",
)
def get_report_history_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """List all previously generated monthly reports."""
    reports = get_user_report_history(user_id=current_user["_id"])
    return ReportListResponse(reports=reports, total=len(reports))


@router.get(
    "/preview/live",
    response_model=ReportPreviewResponse,
    summary="Get live structured preview of monthly report data without saving",
)
def get_live_preview_endpoint(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    current_user: dict = Depends(get_current_user),
):
    """Compile real-time structured data across all 11 sections for in-app viewing."""
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    data = compile_monthly_report_data(
        user_id=current_user["_id"],
        month=target_month,
        year=target_year,
    )
    return ReportPreviewResponse(
        month=target_month,
        year=target_year,
        report_title=f"Monthly Financial Statement - {data['user_overview']['period_name']}",
        user_overview=data["user_overview"],
        financial_summary=data["financial_summary"],
        financial_health_score=data["financial_health_score"],
        spending_analysis=data["spending_analysis"],
        emergency_fund=data["emergency_fund"],
        goals=data["goals"],
        investments=data["investments"],
        debts=data["debts"],
        net_worth=data["net_worth"],
        budgets=data["budgets"],
        ai_insights=data["ai_insights"],
        disclaimer=REPORT_DISCLAIMER,
    )


@router.get(
    "/{report_id}",
    response_model=MonthlyReportResponse,
    summary="Get metadata for a specific report",
)
def get_report_details_endpoint(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve metadata of a single report record."""
    report = get_report_by_id(user_id=current_user["_id"], report_id=report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly report not found",
        )
    return report


@router.get(
    "/{report_id}/download",
    summary="Download professional PDF statement directly",
)
def download_report_pdf_endpoint(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Dynamically builds and streams the official PDF statement.
    """
    res = get_report_pdf_bytes(user_id=current_user["_id"], report_id=report_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly report not found or could not be generated",
        )

    pdf_bytes, file_name = res
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a report from history",
)
def delete_report_endpoint(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete report record from database."""
    success = delete_report(user_id=current_user["_id"], report_id=report_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly report not found or does not belong to user",
        )
    return {"message": "Monthly report successfully deleted"}
