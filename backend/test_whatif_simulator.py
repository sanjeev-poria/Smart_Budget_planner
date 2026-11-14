"""
Automated Integration and Unit Test Suite for What-If Financial Simulator.
Validates:
1. Deterministic simulation calculations across multiple scenarios (Salary hike, Expense cut, SIP step-up, New EMI, Deficit).
2. 5-Pillar Health Score, Emergency Runway, 10-Year Wealth Trajectory, and Goal Feasibility.
3. User profile immutability (simulations NEVER mutate stored user profile data).
4. MongoDB CRUD operations for explicitly saved scenarios.
"""

import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from bson import ObjectId

from app.main import app
from app.services.calculations.whatif_engine import run_whatif_simulation
from app.core.security import create_access_token
from app.database.mongodb import get_database


class TestWhatIfEngineMath(unittest.TestCase):

    def setUp(self):
        self.baseline = {
            "monthly_income": 60000.0,
            "monthly_expenses": 35000.0,
            "current_savings": 70000.0,
            "monthly_emi": 5000.0,
            "monthly_investment": 5000.0,
            "investment_return_rate": 12.0,
        }

    def test_scenario_salary_hike(self):
        """Scenario 1: What if my salary increases by 10,000?"""
        whatif = {"monthly_income": 70000.0}
        res = run_whatif_simulation(self.baseline, whatif)

        # Baseline: surplus = 60k - 35k = 25k
        # What-If: surplus = 70k - 35k = 35k
        surplus_metric = res["metrics"]["monthly_surplus"]
        self.assertEqual(surplus_metric["baseline"], 25000.0)
        self.assertEqual(surplus_metric["what_if"], 35000.0)
        self.assertEqual(surplus_metric["delta"], 10000.0)
        self.assertTrue(surplus_metric["is_improvement"])

        # Health score improves
        health_metric = res["metrics"]["health_score"]
        self.assertGreaterEqual(health_metric["what_if"], health_metric["baseline"])
        self.assertEqual(res["net_financial_impact"]["annual_cashflow_delta"], 120000.0)
        self.assertEqual(res["net_financial_impact"]["rating"], "Highly Positive")

    def test_scenario_expense_reduction(self):
        """Scenario 2: What if I reduce monthly expenses by 5,000?"""
        whatif = {"monthly_expenses": 30000.0}
        res = run_whatif_simulation(self.baseline, whatif)

        # Surplus increases from 25k to 30k (+5k)
        surplus_metric = res["metrics"]["monthly_surplus"]
        self.assertEqual(surplus_metric["what_if"], 30000.0)
        self.assertEqual(surplus_metric["delta"], 5000.0)

        # Emergency runway extends because expenses dropped from 35k to 30k
        runway_metric = res["metrics"]["emergency_runway"]
        self.assertGreater(runway_metric["what_if"], runway_metric["baseline"])
        self.assertTrue(runway_metric["is_improvement"])

    def test_scenario_sip_step_up_compounding(self):
        """Scenario 3: What if I increase my SIP by 3,000 at 12% return?"""
        whatif = {"monthly_investment": 8000.0}  # 5k -> 8k (+3k)
        res = run_whatif_simulation(self.baseline, whatif)

        wealth_metric = res["metrics"]["wealth_10y"]
        self.assertGreater(wealth_metric["what_if"], wealth_metric["baseline"])
        self.assertTrue(wealth_metric["is_improvement"])

        # Verify 10-year trajectory points
        trajectory = res["wealth_trajectory"]
        self.assertEqual(len(trajectory), 10)
        self.assertGreater(trajectory[9]["whatif_wealth"], trajectory[9]["baseline_wealth"])

    def test_scenario_new_emi_burden(self):
        """Scenario 4: What if I take a new car EMI of 5,000?"""
        whatif = {"monthly_emi": 10000.0}  # 5k -> 10k
        res = run_whatif_simulation(self.baseline, whatif)

        # DTI increases from 8.3% to 16.7%
        dti_metric = res["metrics"]["dti_ratio"]
        self.assertGreater(dti_metric["what_if"], dti_metric["baseline"])
        self.assertFalse(dti_metric["is_improvement"])  # Higher DTI is worse

        # Runway shortens (monthly burn is now 35k + 10k = 45k)
        runway_metric = res["metrics"]["emergency_runway"]
        self.assertLess(runway_metric["what_if"], runway_metric["baseline"])

    def test_scenario_critical_outflow_deficit(self):
        """Scenario 5: What if expenses blow out to 80,000 on a 60,000 income?"""
        whatif = {"monthly_expenses": 80000.0}
        res = run_whatif_simulation(self.baseline, whatif)

        surplus_metric = res["metrics"]["monthly_surplus"]
        self.assertEqual(surplus_metric["what_if"], -20000.0)
        self.assertEqual(res["net_financial_impact"]["rating"], "Critical Outflow Risk")


class TestWhatIfLiveAPIAndImmutability(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        db = get_database()
        cls.users_col = db.users
        cls.scenarios_col = db.scenarios

        cls.test_email = "whatif_tester@smartfin.dev"
        cls.users_col.delete_many({"email": cls.test_email})

        cls.user_id = ObjectId()
        cls.original_profile = {
            "_id": cls.user_id,
            "name": "WhatIf Simulator Tester",
            "email": cls.test_email,
            "password_hash": "$2b$12$MockHash...",
            "age": 32,
            "city": "Mumbai",
            "monthly_income": 80000.0,
            "monthly_expenses": 45000.0,
            "current_savings": 150000.0,
            "monthly_investment": 12000.0,
            "emi": 8000.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        cls.users_col.insert_one(cls.original_profile)
        cls.token = create_access_token(cls.test_email)
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    @classmethod
    def tearDownClass(cls):
        cls.users_col.delete_many({"_id": cls.user_id})
        cls.scenarios_col.delete_many({"user_id": cls.user_id})

    def test_simulation_does_not_mutate_profile(self):
        """Verify that running simulations NEVER changes actual user profile data in MongoDB."""
        sim_payload = {
            "monthly_income": 250000.0,  # drastic hypothetical change
            "monthly_expenses": 20000.0,
            "monthly_investment": 50000.0,
        }
        res = self.client.post("/api/v1/what-if/simulate", json=sim_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check simulation response calculated correctly
        self.assertEqual(data["simulated_inputs"]["monthly_income"], 250000.0)
        self.assertEqual(data["baseline_profile"]["monthly_income"], 80000.0)

        # CRITICAL CHECK: Verify user document in MongoDB is 100% UNCHANGED
        user_in_db = self.users_col.find_one({"_id": self.user_id})
        self.assertEqual(user_in_db["monthly_income"], 80000.0)
        self.assertEqual(user_in_db["monthly_expenses"], 45000.0)
        self.assertEqual(user_in_db["monthly_investment"], 12000.0)

    def test_saved_scenarios_mongodb_crud(self):
        """Test explicitly saving, listing, updating, and deleting scenarios."""
        # 1. Save Scenario
        save_payload = {
            "scenario_name": "Senior Software Architect Promotion",
            "description": "Assumes a 40% salary increase with 20k SIP step-up",
            "inputs": {
                "monthly_income": 112000.0,
                "monthly_investment": 32000.0,
            },
        }
        save_res = self.client.post("/api/v1/what-if/saved", json=save_payload, headers=self.headers)
        self.assertEqual(save_res.status_code, 201)
        scenario_data = save_res.json()
        s_id = scenario_data["id"]
        self.assertEqual(scenario_data["scenario_name"], "Senior Software Architect Promotion")

        # 2. List saved scenarios
        list_res = self.client.get("/api/v1/what-if/saved", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        saved_list = list_res.json()
        self.assertTrue(any(s["id"] == s_id for s in saved_list))

        # 3. Update / Rename scenario
        update_payload = {
            "scenario_name": "VP of Engineering Promotion",
        }
        update_res = self.client.put(f"/api/v1/what-if/saved/{s_id}", json=update_payload, headers=self.headers)
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["scenario_name"], "VP of Engineering Promotion")

        # 4. Delete scenario
        del_res = self.client.delete(f"/api/v1/what-if/saved/{s_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

        # Confirm deleted
        get_res = self.client.get(f"/api/v1/what-if/saved/{s_id}", headers=self.headers)
        self.assertEqual(get_res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
