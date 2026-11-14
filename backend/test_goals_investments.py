"""
SMARTFIN — Automated Goals & Investment Module Test Suite
Verifies:
1. Pure Python deterministic goal calculations and edge cases:
   - target_amount <= 0
   - current_saved >= target_amount
   - past target dates (overdue, 0 months)
   - zero months remaining
   - on_track determination against monthly cashflow surplus
2. Pure Python deterministic investment compounding & inflation discounting:
   - SIP annuity compounding formula
   - Zero return rate defensive handling
   - Inflation discounting real value verification
   - Annual trajectory array generation
3. Authenticated FastAPI REST endpoints:
   - POST /api/v1/goals
   - GET /api/v1/goals
   - GET /api/v1/goals/{id}
   - PUT /api/v1/goals/{id}
   - DELETE /api/v1/goals/{id}
   - POST /api/v1/investments/calculate
   - GET /api/v1/investments/assumptions
   - PUT /api/v1/investments/assumptions
   - GET /api/v1/investments/projection
"""

import sys
import os
import unittest
from datetime import date, timedelta
from bson import ObjectId

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.goal_service import compute_goal_metrics
from app.services.calculations.investment_engine import calculate_investment_projection
from app.database.mongodb import get_database, ping_database
from app.core.security import create_access_token
from fastapi.testclient import TestClient
from app.main import app


class TestGoalsAndInvestments(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Connect to MongoDB and obtain JWT bearer token for test user."""
        cls.connected = ping_database()
        cls.client = TestClient(app)

        db = get_database()
        cls.user = db.users.find_one({"email": "bruce.wayne@example.com"})
        if not cls.user:
            cls.user = db.users.find_one({})

        if cls.user:
            token = create_access_token(cls.user["email"])
            cls.headers = {"Authorization": f"Bearer {token}"}
        else:
            cls.headers = {}

    # =========================================================================
    # 1. Deterministic Goal Calculations & Edge Cases
    # =========================================================================

    def test_goal_target_amount_zero_or_negative(self):
        """Edge Case: Target amount <= 0 should be treated as 100% completed with 0 required."""
        goal_doc = {
            "id": "mock-1",
            "goal_name": "Zero Target Goal",
            "target_amount": 0.0,
            "current_saved": 0.0,
            "target_date": "2030-01-01",
            "category": "Other",
        }
        res = compute_goal_metrics(goal_doc, monthly_surplus=1000.0)
        self.assertEqual(res["progress_percentage"], 100.0)
        self.assertEqual(res["amount_remaining"], 0.0)
        self.assertEqual(res["monthly_required"], 0.0)
        self.assertTrue(res["on_track"])
        self.assertEqual(res["status"], "completed")

    def test_goal_current_saved_exceeds_target(self):
        """Edge Case: Current saved > target amount should cap at 100% and 0 remaining."""
        goal_doc = {
            "id": "mock-2",
            "goal_name": "Overfunded Goal",
            "target_amount": 5000.0,
            "current_saved": 6000.0,
            "target_date": "2028-12-31",
            "category": "Wealth",
        }
        res = compute_goal_metrics(goal_doc, monthly_surplus=500.0)
        self.assertEqual(res["progress_percentage"], 100.0)
        self.assertEqual(res["amount_remaining"], 0.0)
        self.assertEqual(res["monthly_required"], 0.0)
        self.assertTrue(res["on_track"])
        self.assertEqual(res["status"], "completed")

    def test_goal_past_target_date(self):
        """Edge Case: Target date in past should result in 0 months remaining and overdue status."""
        today = date(2026, 9, 23)
        past_date = (today - timedelta(days=60)).strftime("%Y-%m-%d")
        goal_doc = {
            "id": "mock-3",
            "goal_name": "Expired Goal",
            "target_amount": 10000.0,
            "current_saved": 2000.0,
            "target_date": past_date,
            "category": "Other",
        }
        res = compute_goal_metrics(goal_doc, monthly_surplus=500.0, reference_date=today)
        self.assertEqual(res["months_remaining"], 0)
        self.assertEqual(res["amount_remaining"], 8000.0)
        self.assertEqual(res["monthly_required"], 8000.0)
        self.assertEqual(res["status"], "overdue")
        self.assertFalse(res["on_track"])

    def test_goal_on_track_with_sufficient_surplus(self):
        """Standard Case: Target ₹12,000, Saved ₹6,000, 12 months left -> ₹500/mo needed."""
        today = date(2026, 9, 23)
        target_date = (today + timedelta(days=365)).strftime("%Y-%m-%d")
        goal_doc = {
            "id": "mock-4",
            "goal_name": "Downpayment",
            "target_amount": 12000.0,
            "current_saved": 6000.0,
            "target_date": target_date,
            "category": "Real Estate",
        }
        # Surplus ₹1,000/mo >= ₹500/mo required -> on track
        res = compute_goal_metrics(goal_doc, monthly_surplus=1000.0, reference_date=today)
        self.assertEqual(res["progress_percentage"], 50.0)
        self.assertEqual(res["amount_remaining"], 6000.0)
        self.assertEqual(res["months_remaining"], 12)
        self.assertEqual(res["monthly_required"], 500.0)
        self.assertTrue(res["on_track"])
        self.assertEqual(res["status"], "on_track")

    def test_goal_off_track_with_insufficient_surplus(self):
        """Standard Case: Surplus ₹200/mo < ₹500/mo required -> off track."""
        today = date(2026, 9, 23)
        target_date = (today + timedelta(days=365)).strftime("%Y-%m-%d")
        goal_doc = {
            "id": "mock-5",
            "goal_name": "Car Purchase",
            "target_amount": 12000.0,
            "current_saved": 6000.0,
            "target_date": target_date,
            "category": "Vehicle",
        }
        res = compute_goal_metrics(goal_doc, monthly_surplus=200.0, reference_date=today)
        self.assertEqual(res["monthly_required"], 500.0)
        self.assertFalse(res["on_track"])
        self.assertEqual(res["status"], "off_track")

    # =========================================================================
    # 2. Deterministic Investment Compounding & Inflation Calculations
    # =========================================================================

    def test_investment_standard_sip_annuity(self):
        """Verify compound interest formulas for ₹500/mo at 10% for 10 years with 6% inflation."""
        res = calculate_investment_projection(
            monthly_investment=500.0,
            annual_return_rate=10.0,
            investment_period=10,
            inflation_rate=6.0,
            initial_lumpsum=0.0,
        )
        self.assertEqual(res["total_invested"], 60000.0)
        # In financial benchmark, ₹500/mo for 10 yrs at 10% yields ~₹103,276
        self.assertGreater(res["estimated_future_value"], 100000.0)
        self.assertLess(res["estimated_future_value"], 110000.0)
        self.assertGreater(res["estimated_gains"], 40000.0)
        # Real purchasing power should be discounted by (1.06)^10 (~1.7908)
        expected_discount = (1.06) ** 10
        expected_real = res["estimated_future_value"] / expected_discount
        self.assertAlmostEqual(res["inflation_adjusted_value"], expected_real, places=1)
        self.assertIn("trajectory", res)
        self.assertEqual(len(res["trajectory"]), 10)

    def test_investment_zero_return_rate(self):
        """Defensive Handling: 0% return rate should exactly equal total invested capital."""
        res = calculate_investment_projection(
            monthly_investment=1000.0,
            annual_return_rate=0.0,
            investment_period=5,
            inflation_rate=5.0,
            initial_lumpsum=5000.0,
        )
        # Total invested = (1000 * 60) + 5000 = 65,000
        self.assertEqual(res["total_invested"], 65000.0)
        self.assertEqual(res["estimated_future_value"], 65000.0)
        self.assertEqual(res["estimated_gains"], 0.0)
        # Real purchasing power must be lower due to inflation
        self.assertLess(res["inflation_adjusted_value"], 65000.0)

    # =========================================================================
    # 3. Authenticated REST API Lifecycle
    # =========================================================================

    def test_goals_api_crud_lifecycle(self):
        """End-to-End Test: Create, Read, Update, and Delete a goal via FastAPI routes."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        # 1. Create Goal
        payload = {
            "goal_name": "Automated Test Vacation Fund",
            "target_amount": 5000.0,
            "current_saved": 1000.0,
            "target_date": "2028-06-30",
            "category": "Travel",
            "description": "Family European holiday",
        }
        res_create = self.client.post("/api/v1/goals", json=payload, headers=self.headers)
        self.assertEqual(res_create.status_code, 201, res_create.text)
        created = res_create.json()
        goal_id = created["id"]
        self.assertEqual(created["goal_name"], payload["goal_name"])
        self.assertEqual(created["progress_percentage"], 20.0)
        self.assertEqual(created["amount_remaining"], 4000.0)

        # 2. List Goals
        res_list = self.client.get("/api/v1/goals", headers=self.headers)
        self.assertEqual(res_list.status_code, 200, res_list.text)
        list_data = res_list.json()
        self.assertGreater(list_data["summary"]["total_goals"], 0)
        found = any(g["id"] == goal_id for g in list_data["items"])
        self.assertTrue(found)

        # 3. Get Single Goal
        res_get = self.client.get(f"/api/v1/goals/{goal_id}", headers=self.headers)
        self.assertEqual(res_get.status_code, 200, res_get.text)

        # 4. Update Goal (Increase current saved)
        res_update = self.client.put(
            f"/api/v1/goals/{goal_id}",
            json={"current_saved": 5000.0},
            headers=self.headers,
        )
        self.assertEqual(res_update.status_code, 200, res_update.text)
        updated = res_update.json()
        self.assertEqual(updated["current_saved"], 5000.0)
        self.assertEqual(updated["progress_percentage"], 100.0)
        self.assertEqual(updated["status"], "completed")

        # 5. Delete Goal
        res_delete = self.client.delete(f"/api/v1/goals/{goal_id}", headers=self.headers)
        self.assertEqual(res_delete.status_code, 200, res_delete.text)

        # Verify deletion
        res_verify = self.client.get(f"/api/v1/goals/{goal_id}", headers=self.headers)
        self.assertEqual(res_verify.status_code, 404)

    def test_investments_api_endpoints(self):
        """End-to-End Test: Investment calculation, assumptions save & retrieval."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        # 1. POST /api/v1/investments/calculate
        calc_payload = {
            "monthly_investment": 750.0,
            "annual_return_rate": 12.0,
            "investment_period": 15,
            "inflation_rate": 5.5,
            "initial_lumpsum": 10000.0,
        }
        res_calc = self.client.post("/api/v1/investments/calculate", json=calc_payload, headers=self.headers)
        self.assertEqual(res_calc.status_code, 200, res_calc.text)
        calc_data = res_calc.json()
        self.assertEqual(calc_data["investment_period"], 15)
        self.assertEqual(len(calc_data["trajectory"]), 15)
        self.assertIn("disclaimer", calc_data)

        # 2. PUT /api/v1/investments/assumptions (save user preference)
        save_payload = {
            "monthly_investment": 1200.0,
            "annual_return_rate": 11.5,
            "investment_period": 20,
            "inflation_rate": 6.0,
            "initial_lumpsum": 25000.0,
        }
        res_save = self.client.put("/api/v1/investments/assumptions", json=save_payload, headers=self.headers)
        self.assertEqual(res_save.status_code, 200, res_save.text)
        saved_data = res_save.json()
        self.assertEqual(saved_data["monthly_investment"], 1200.0)

        # 3. GET /api/v1/investments/assumptions
        res_get = self.client.get("/api/v1/investments/assumptions", headers=self.headers)
        self.assertEqual(res_get.status_code, 200, res_get.text)
        get_data = res_get.json()
        self.assertEqual(get_data["monthly_investment"], 1200.0)
        self.assertEqual(get_data["annual_return_rate"], 11.5)

        # 4. GET /api/v1/investments/projection
        res_proj = self.client.get("/api/v1/investments/projection", headers=self.headers)
        self.assertEqual(res_proj.status_code, 200, res_proj.text)
        proj_data = res_proj.json()
        self.assertEqual(proj_data["monthly_investment"], 1200.0)
        self.assertEqual(len(proj_data["trajectory"]), 20)


if __name__ == "__main__":
    unittest.main()
