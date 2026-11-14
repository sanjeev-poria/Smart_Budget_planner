from typing import Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    connected: bool = Field(..., description="Whether the database responded successfully to ping")
    database_name: str = Field(..., description="Target database name")
    latency_ms: Optional[float] = Field(None, description="Roundtrip ping latency in milliseconds")
    error: Optional[str] = Field(None, description="Error message if ping failed")


class ServicesHealth(BaseModel):
    financial_engine: str = Field(..., description="Status of deterministic calculation engine")
    ai_service: str = Field(..., description="Status of Gemini AI service configuration")
    report_generator: str = Field(..., description="Status of PDF report generation service")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall system health status")
    timestamp: str = Field(..., description="Server timestamp (ISO format)")
    app_name: str = Field(..., description="Application name")
    environment: str = Field(..., description="Deployment environment")
    version: str = Field(default="1.0.0", description="Application version")
    database: DatabaseHealth = Field(..., description="Database connection status")
    services: ServicesHealth = Field(..., description="Backend subsystem readiness")
