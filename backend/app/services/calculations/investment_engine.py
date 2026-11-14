import math
from typing import Any, Dict, List, Optional


DISCLAIMER_TEXT = (
    "Investment projections are calculated deterministically using mathematical compound interest "
    "and inflation discounting models for educational and planning purposes only. "
    "They do not represent guaranteed returns or financial advisory recommendations. "
    "Actual market returns fluctuate based on market volatility, asset class performance, and economic factors."
)


def calculate_investment_projection(
    monthly_investment: float,
    annual_return_rate: float,
    investment_period: int,
    inflation_rate: float = 6.0,
    initial_lumpsum: float = 0.0,
) -> Dict[str, Any]:
    """
    Pure Python deterministic investment projection calculator.
    Uses Systematic Investment Plan (SIP) monthly compounding annuity formula
    and inflation discounting for real purchasing power.
    """
    # Defensive bounds
    p_monthly = max(0.0, float(monthly_investment))
    r_annual = max(0.0, float(annual_return_rate))
    years = max(1, int(investment_period))
    i_inflation = max(0.0, float(inflation_rate))
    p_lump = max(0.0, float(initial_lumpsum))

    monthly_rate = (r_annual / 100.0) / 12.0
    total_months = years * 12

    total_invested = (p_monthly * total_months) + p_lump

    # Future value calculation
    if monthly_rate > 0.0:
        # Standard SIP annuity due formula (deposits at beginning of month)
        fv_sip = p_monthly * (((1.0 + monthly_rate) ** total_months - 1.0) / monthly_rate) * (1.0 + monthly_rate)
        fv_lump = p_lump * ((1.0 + monthly_rate) ** total_months)
        future_value = fv_sip + fv_lump
    else:
        future_value = total_invested

    estimated_gains = max(0.0, future_value - total_invested)

    # Inflation adjustment: discounting nominal FV to real purchasing power
    inflation_factor = (1.0 + (i_inflation / 100.0)) ** years if i_inflation >= 0 else 1.0
    inflation_adjusted_value = future_value / inflation_factor if inflation_factor > 0 else future_value
    real_gains = max(0.0, inflation_adjusted_value - total_invested)

    # Generate annual trajectory points for Recharts visualization
    trajectory: List[Dict[str, Any]] = []
    for y in range(1, years + 1):
        m = y * 12
        inv_y = (p_monthly * m) + p_lump

        if monthly_rate > 0.0:
            fv_sip_y = p_monthly * (((1.0 + monthly_rate) ** m - 1.0) / monthly_rate) * (1.0 + monthly_rate)
            fv_lump_y = p_lump * ((1.0 + monthly_rate) ** m)
            fv_y = fv_sip_y + fv_lump_y
        else:
            fv_y = inv_y

        inf_factor_y = (1.0 + (i_inflation / 100.0)) ** y if i_inflation >= 0 else 1.0
        fv_real_y = fv_y / inf_factor_y if inf_factor_y > 0 else fv_y

        trajectory.append({
            "year": y,
            "total_invested": round(inv_y, 2),
            "future_value": round(fv_y, 2),
            "inflation_adjusted_value": round(fv_real_y, 2),
            "estimated_gains": round(max(0.0, fv_y - inv_y), 2),
        })

    return {
        "monthly_investment": round(p_monthly, 2),
        "annual_return_rate": round(r_annual, 2),
        "investment_period": years,
        "inflation_rate": round(i_inflation, 2),
        "initial_lumpsum": round(p_lump, 2),
        "total_invested": round(total_invested, 2),
        "estimated_future_value": round(future_value, 2),
        "estimated_gains": round(estimated_gains, 2),
        "inflation_adjusted_value": round(inflation_adjusted_value, 2),
        "real_gains": round(real_gains, 2),
        "trajectory": trajectory,
        "disclaimer": DISCLAIMER_TEXT,
    }
