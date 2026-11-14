from fastapi import APIRouter
from app.routes import (
    health,
    auth,
    users,
    transactions,
    analytics,
    goals,
    investments,
    debts,
    net_worth,
    budgets,
    tax,
    scenarios,
    ai,
    reports,
)

api_router = APIRouter()

# Mount health routes under /api/v1/health
api_router.include_router(health.router, prefix="", tags=["System Health"])

# Mount authentication routes under /api/v1/auth
api_router.include_router(auth.router)

# Mount user management routes under /api/v1/users
api_router.include_router(users.router)

# Mount transactions routes under /api/v1/transactions
api_router.include_router(transactions.router)

# Mount financial analytics & calculation routes under /api/v1/analytics
api_router.include_router(analytics.router)

# Mount goals routes under /api/v1/goals
api_router.include_router(goals.router)

# Mount investments routes under /api/v1/investments
api_router.include_router(investments.router)

# Mount debt management routes under /api/v1/debts
api_router.include_router(debts.router)

# Mount net worth & balance sheet routes under /api/v1/net-worth
api_router.include_router(net_worth.router)

# Mount budget management routes under /api/v1/budgets
api_router.include_router(budgets.router)

# Mount tax center routes under /api/v1/tax
api_router.include_router(tax.router)

# Mount What-If Financial Simulator routes under /api/v1/what-if
api_router.include_router(scenarios.router)

# Mount AI Financial Assistant routes under /api/v1/ai
api_router.include_router(ai.router)

# Mount Monthly Financial Reports routes under /api/v1/reports
api_router.include_router(reports.router)
