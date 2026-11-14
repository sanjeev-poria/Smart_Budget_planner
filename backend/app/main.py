import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes.api import api_router
from app.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smartfin.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for clean startup and shutdown."""
    logger.info("Initializing SMARTFIN Backend Services...")
    connect_to_mongo()
    yield
    logger.info("Shutting down SMARTFIN Backend Services...")
    close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-Powered Personal Financial Management System REST API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Top-level direct health check endpoint alias
app.include_router(health_router, prefix="", tags=["System Health"])


@app.get("/", tags=["Root"])
def root_status():
    """Root entrypoint returning application metadata."""
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "version": "1.0.0",
    }
