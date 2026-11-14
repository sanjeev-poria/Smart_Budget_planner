from app.services.calculations.financial_engine import (
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_runway,
    calculate_emergency_fund,
    calculate_financial_health,
    record_score_history_snapshot,
    determine_risk_level,
)
from app.services.calculations.investment_engine import (
    calculate_investment_projection,
    DISCLAIMER_TEXT,
)
from app.services.calculations.debt_engine import (
    calculate_debt_repayment_plan,
)
from app.services.calculations.budget_engine import (
    calculate_budget_metrics,
    calculate_budget_overview,
)
from app.services.calculations.tax_engine import (
    compute_80c_summary,
    compute_deductions_breakdown,
    compute_new_regime_tax,
    compute_old_regime_tax,
    compare_tax_regimes,
)
from app.services.calculations.whatif_engine import (
    run_whatif_simulation,
)

def check_engine_status() -> str:
    """Return the status of the calculation engine."""
    return "ready"

__all__ = [
    "check_engine_status",
    "calculate_surplus",
    "calculate_savings_rate",
    "calculate_emergency_runway",
    "calculate_emergency_fund",
    "calculate_financial_health",
    "record_score_history_snapshot",
    "determine_risk_level",
    "calculate_investment_projection",
    "DISCLAIMER_TEXT",
    "calculate_debt_repayment_plan",
    "calculate_budget_metrics",
    "calculate_budget_overview",
    "compute_80c_summary",
    "compute_deductions_breakdown",
    "compute_new_regime_tax",
    "compute_old_regime_tax",
    "compare_tax_regimes",
    "run_whatif_simulation",
]

