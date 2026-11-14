from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status

from app.core.deps import get_current_user
from app.schemas.scenario import (
    ScenarioInputs,
    ScenarioCreate,
    ScenarioUpdate,
    ScenarioResponse,
    WhatIfSimulationResponse,
)
from app.services import scenario_service

router = APIRouter(prefix="/what-if", tags=["What-If Financial Simulator"])


@router.get(
    "/baseline",
    response_model=Dict[str, Any],
    summary="Get user's live baseline financial parameters for simulator inputs",
)
def get_baseline_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns authenticated user's current stored income, expenses, savings,
    EMI, and investment parameters as the baseline for simulation sliders.
    """
    return scenario_service.get_baseline_profile(user_id=current_user["_id"])


@router.post(
    "/simulate",
    response_model=WhatIfSimulationResponse,
    summary="Execute real-time What-If sensitivity simulation",
)
def simulate_scenario(
    payload: ScenarioInputs,
    current_user: dict = Depends(get_current_user),
):
    """
    Calculates deterministic impact of hypothetical variable changes across:
    - Cashflow Surplus & Savings Rate
    - Financial Health Score (0-100) & Risk Level
    - Emergency Runway & Coverage Target
    - 10-Year SIP Compounding Trajectory
    - Active Goals Feasibility
    - Debt-to-Income Ratio
    CRITICAL: Does NOT modify the user's stored profile or database records.
    """
    return scenario_service.simulate_whatif(
        user_id=current_user["_id"],
        inputs=payload,
    )


@router.get(
    "/saved",
    response_model=List[ScenarioResponse],
    summary="List all explicitly saved scenarios for the user",
)
def list_saved_scenarios(current_user: dict = Depends(get_current_user)):
    return scenario_service.get_saved_scenarios(user_id=current_user["_id"])


@router.post(
    "/saved",
    response_model=ScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Explicitly save a named scenario to MongoDB",
)
def save_scenario(
    payload: ScenarioCreate,
    current_user: dict = Depends(get_current_user),
):
    return scenario_service.save_scenario(
        user_id=current_user["_id"],
        data=payload,
    )


@router.get(
    "/saved/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Retrieve single saved scenario by ID",
)
def get_saved_scenario(
    scenario_id: str,
    current_user: dict = Depends(get_current_user),
):
    return scenario_service.get_saved_scenario_by_id(
        user_id=current_user["_id"],
        scenario_id=scenario_id,
    )


@router.put(
    "/saved/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Update or rename an existing saved scenario",
)
def update_saved_scenario(
    scenario_id: str,
    payload: ScenarioUpdate,
    current_user: dict = Depends(get_current_user),
):
    return scenario_service.update_saved_scenario(
        user_id=current_user["_id"],
        scenario_id=scenario_id,
        data=payload,
    )


@router.delete(
    "/saved/{scenario_id}",
    summary="Delete a saved scenario",
)
def delete_saved_scenario(
    scenario_id: str,
    current_user: dict = Depends(get_current_user),
):
    return scenario_service.delete_saved_scenario(
        user_id=current_user["_id"],
        scenario_id=scenario_id,
    )
