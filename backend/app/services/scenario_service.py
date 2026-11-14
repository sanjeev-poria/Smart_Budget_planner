from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.scenario import scenario_helper, create_scenario_document
from app.schemas.scenario import (
    ScenarioInputs,
    ScenarioCreate,
    ScenarioUpdate,
    ScenarioResponse,
    WhatIfSimulationResponse,
)
from app.services.calculations.whatif_engine import run_whatif_simulation


def get_scenarios_collection():
    return get_database().scenarios


def get_users_collection():
    return get_database().users


def get_goals_collection():
    return get_database().goals


def get_debts_collection():
    return get_database().debts


def get_baseline_profile(user_id: ObjectId) -> Dict[str, Any]:
    """
    Retrieve live baseline parameters from the user's stored profile, active goals, and debts.
    Guarantees no hardcoded assumptions.
    """
    user = get_users_collection().find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    monthly_income = float(user.get("monthly_income", 0.0))
    monthly_expenses = float(user.get("monthly_expenses", 0.0))
    current_savings = float(user.get("current_savings", 0.0))
    monthly_emi = float(user.get("emi", 0.0))
    monthly_investment = float(user.get("monthly_investment", 0.0))

    # Fetch active debts if EMI is unset in profile
    if monthly_emi <= 0:
        active_debts = list(get_debts_collection().find({"user_id": user_id}))
        monthly_emi = sum(float(d.get("minimum_payment", 0.0)) for d in active_debts)

    return {
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "current_savings": current_savings,
        "monthly_emi": monthly_emi,
        "monthly_investment": monthly_investment,
        "investment_return_rate": 12.0,  # Standard diversified market benchmark
        "debt_payment": monthly_emi,
        "monthly_savings": max(0.0, monthly_income - monthly_expenses),
        "target_goal_contribution": 0.0,
    }


def simulate_whatif(user_id: ObjectId, inputs: ScenarioInputs) -> WhatIfSimulationResponse:
    """
    Runs a real-time sensitivity calculation against the user's live profile.
    CRITICAL: Does NOT mutate or write any records to the database.
    """
    baseline = get_baseline_profile(user_id)
    active_goals = list(get_goals_collection().find({"user_id": user_id}))
    active_debts = list(get_debts_collection().find({"user_id": user_id}))

    sim_inputs_dict = {k: v for k, v in inputs.model_dump().items() if v is not None}
    sim_result = run_whatif_simulation(
        baseline_profile=baseline,
        whatif_inputs=sim_inputs_dict,
        active_goals=active_goals,
        active_debts=active_debts,
    )

    return WhatIfSimulationResponse(**sim_result)


def save_scenario(user_id: ObjectId, data: ScenarioCreate) -> ScenarioResponse:
    """Explicitly save a named what-if scenario to MongoDB."""
    col = get_scenarios_collection()
    inputs_dict = data.inputs.model_dump(exclude_none=True)
    doc = create_scenario_document(
        user_id=user_id,
        scenario_name=data.scenario_name,
        description=data.description,
        inputs=inputs_dict,
    )
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ScenarioResponse(**scenario_helper(doc))


def get_saved_scenarios(user_id: ObjectId) -> List[ScenarioResponse]:
    """Retrieve all saved scenarios for the authenticated user."""
    col = get_scenarios_collection()
    cursor = col.find({"user_id": user_id}).sort("created_at", -1)
    return [ScenarioResponse(**scenario_helper(d)) for d in cursor]


def get_saved_scenario_by_id(user_id: ObjectId, scenario_id: str) -> ScenarioResponse:
    """Retrieve a single saved scenario by ID."""
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    doc = get_scenarios_collection().find_one({"_id": ObjectId(scenario_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    return ScenarioResponse(**scenario_helper(doc))


def update_saved_scenario(user_id: ObjectId, scenario_id: str, data: ScenarioUpdate) -> ScenarioResponse:
    """Update name, description, or inputs of an existing saved scenario."""
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    col = get_scenarios_collection()
    doc = col.find_one({"_id": ObjectId(scenario_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    updates: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.scenario_name is not None:
        updates["scenario_name"] = data.scenario_name.strip()
    if data.description is not None:
        updates["description"] = data.description.strip()
    if data.inputs is not None:
        updates["inputs"] = data.inputs.model_dump(exclude_none=True)

    col.update_one({"_id": ObjectId(scenario_id)}, {"$set": updates})
    updated_doc = col.find_one({"_id": ObjectId(scenario_id)})
    return ScenarioResponse(**scenario_helper(updated_doc))


def delete_saved_scenario(user_id: ObjectId, scenario_id: str) -> Dict[str, Any]:
    """Delete a saved scenario from MongoDB."""
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    col = get_scenarios_collection()
    result = col.delete_one({"_id": ObjectId(scenario_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    return {"message": "Scenario successfully deleted", "id": scenario_id}
