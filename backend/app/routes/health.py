from fastapi import APIRouter
from app.core.config import settings
from app.database.mongodb import ping_database
from app.schemas.health import HealthResponse, DatabaseHealth, ServicesHealth
from app.services.calculations import check_engine_status
from app.services.ai import check_ai_status
from app.utils.helpers import get_utc_now_iso

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & Connectivity Check",
    description="Returns backend API operational status, MongoDB ping connectivity, and subsystem states."
)
def get_health_status() -> HealthResponse:
    """Check health of the API, MongoDB connection, and services."""
    db_status = ping_database()

    db_health = DatabaseHealth(
        connected=db_status.get("connected", False),
        database_name=db_status.get("database_name", settings.MONGODB_DB_NAME),
        latency_ms=db_status.get("latency_ms"),
        error=db_status.get("error")
    )

    services_health = ServicesHealth(
        financial_engine=check_engine_status(),
        ai_service=check_ai_status(),
        report_generator="ready"
    )

    overall_status = "healthy" if db_health.connected else "degraded"

    return HealthResponse(
        status=overall_status,
        timestamp=get_utc_now_iso(),
        app_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        version="1.0.0",
        database=db_health,
        services=services_health
    )
