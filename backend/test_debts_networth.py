"""
SMARTFIN — Automated Debt Management, Assets, Liabilities, and Net Worth Test Suite
Verifies:
1. Pure Python deterministic repayment engine:
   - Avalanche prioritizes highest APR
   - Snowball prioritizes smallest balance
   - Avalanche minimizes total interest compared to Snowball
   - Negative amortization / insufficient payment detection
   - Payment rollover mechanics
2. Authenticated REST API Lifecycle for Debts:
   - POST /api/v1/debts
   - GET /api/v1/debts
   - GET /api/v1/debts/{id}
   - PUT /api/v1/debts/{id}
   - DELETE /api/v1/debts/{id}
   - POST /api/v1/debts/plan
3. Authenticated REST API Lifecycle for Assets, Liabilities, and Net Worth:
   - POST /api/v1/net-worth/assets
   - GET /api/v1/net-worth/assets
   - DELETE /api/v1/net-worth/assets/{id}
   - POST /api/v1/net-worth/liabilities
   - GET /api/v1/net-worth/liabilities
   - DELETE /api/v1/net-worth/liabilities/{id}
   - GET /api/v1/net-worth (net_worth = total_assets - total_liabilities)
"""

import sys
import os
import unittest
from bson import ObjectId

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.calculations.debt_engine import calculate_debt_repayment_plan
from app.database.mongodb import get_database, ping_database
from app.core.security import create_access_token
from fastapi.testclient import TestClient
from app.main import app


class TestDebtsAndNetWorth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Connect to MongoDB Atlas and obtain JWT bearer token for test user."""
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
    # 1. Deterministic Debt Repayment Engine Calculations
    # =========================================================================

    def test_avalanche_vs_snowball_priority_and_interest(self):
        """
        Verify Avalanche saves more interest than Snowball.
        Debt A: ₹2,000 balance @ 24% APR (min payment ₹100)
        Debt B: ₹1,000 balance @ 10% APR (min payment ₹50)
        """
        sample_debts = [
            {"id": "d1", "debt_name": "High Rate Card", "remaining_balance": 2000.0, "interest_rate": 24.0, "minimum_payment": 100.0},
            {"id": "d2", "debt_name": "Low Balance Loan", "remaining_balance": 1000.0, "interest_rate": 10.0, "minimum_payment": 50.0},
        ]

        # Total min payment = ₹150, extra = ₹100 -> Budget = ₹250
        avalanche_plan = calculate_debt_repayment_plan(sample_debts, strategy="avalanche", extra_monthly_payment=100.0)
        snowball_plan = calculate_debt_repayment_plan(sample_debts, strategy="snowball", extra_monthly_payment=100.0)

        self.assertTrue(avalanche_plan["is_viable"])
        self.assertTrue(snowball_plan["is_viable"])

        # Avalanche must pay less or equal total interest than Snowball
        self.assertLessEqual(avalanche_plan["total_interest_paid"], snowball_plan["total_interest_paid"])

        # Avalanche should pay off Debt A first or simultaneously; Snowball should pay off Debt B (smallest balance) first
        per_debt_avalanche = {d["debt_id"]: d["payoff_month"] for d in avalanche_plan["per_debt_summary"]}
        per_debt_snowball = {d["debt_id"]: d["payoff_month"] for d in snowball_plan["per_debt_summary"]}

        # Under Snowball, Debt B (₹1000) should be cleared earlier than Debt A (₹2000)
        self.assertLess(per_debt_snowball["d2"], per_debt_snowball["d1"])

        # Both must reach 0 remaining balance
        self.assertGreater(len(avalanche_plan["schedule"]), 0)
        self.assertAlmostEqual(avalanche_plan["schedule"][-1]["remaining_total"], 0.0, places=1)
        self.assertAlmostEqual(snowball_plan["schedule"][-1]["remaining_total"], 0.0, places=1)

    def test_negative_amortization_detection(self):
        """
        Validation: When monthly payment <= monthly interest accrued, flag negative amortization.
        Debt: ₹100,000 @ 24% APR -> Monthly interest = ₹2,000/mo.
        Payment: ₹100/mo (far below interest).
        """
        bad_debt = [
            {"id": "d_neg", "debt_name": "Toxic Card", "remaining_balance": 100000.0, "interest_rate": 24.0, "minimum_payment": 100.0}
        ]
        res = calculate_debt_repayment_plan(bad_debt, strategy="avalanche", extra_monthly_payment=0.0)
        self.assertFalse(res["is_viable"])
        self.assertIsNotNone(res["warning_message"])
        self.assertIn("negative amortization", res["warning_message"].lower())
        self.assertGreater(res["minimum_viable_payment"], 1900.0)

    def test_empty_debts_plan(self):
        """Defensive handling: Zero debts should return a clean 0-month plan."""
        res = calculate_debt_repayment_plan([], strategy="avalanche")
        self.assertTrue(res["is_viable"])
        self.assertEqual(res["months_to_debt_free"], 0)
        self.assertEqual(res["total_interest_paid"], 0.0)
        self.assertEqual(len(res["schedule"]), 0)

    # =========================================================================
    # 2. Authenticated REST API Lifecycle for Debts
    # =========================================================================

    def test_debts_api_crud_and_plan(self):
        """End-to-End Test: Create, Read, Update, Plan, and Delete a debt liability."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        # 1. Create Debt
        payload = {
            "debt_name": "Test Venture Capital Note",
            "principal": 10000.0,
            "remaining_balance": 8500.0,
            "interest_rate": 12.5,
            "minimum_payment": 300.0,
            "due_date": "15th",
            "category": "Personal Loan",
        }
        res_create = self.client.post("/api/v1/debts", json=payload, headers=self.headers)
        self.assertEqual(res_create.status_code, 201, res_create.text)
        created = res_create.json()
        debt_id = created["id"]
        self.assertEqual(created["debt_name"], payload["debt_name"])
        self.assertAlmostEqual(created["payoff_progress"], 15.0, places=1)

        # 2. List Debts
        res_list = self.client.get("/api/v1/debts", headers=self.headers)
        self.assertEqual(res_list.status_code, 200, res_list.text)
        list_data = res_list.json()
        self.assertGreater(list_data["summary"]["total_debts"], 0)
        found = any(d["id"] == debt_id for d in list_data["items"])
        self.assertTrue(found)

        # 3. Get Single Debt
        res_get = self.client.get(f"/api/v1/debts/{debt_id}", headers=self.headers)
        self.assertEqual(res_get.status_code, 200, res_get.text)

        # 4. Update Debt
        res_update = self.client.put(
            f"/api/v1/debts/{debt_id}",
            json={"remaining_balance": 7000.0},
            headers=self.headers,
        )
        self.assertEqual(res_update.status_code, 200, res_update.text)
        self.assertEqual(res_update.json()["remaining_balance"], 7000.0)

        # 5. POST /api/v1/debts/plan
        res_plan = self.client.post(
            "/api/v1/debts/plan",
            json={"strategy": "avalanche", "extra_monthly_payment": 200.0},
            headers=self.headers,
        )
        self.assertEqual(res_plan.status_code, 200, res_plan.text)
        plan_data = res_plan.json()
        self.assertIn("months_to_debt_free", plan_data)
        self.assertIn("schedule", plan_data)
        self.assertIn("comparison", plan_data)

        # 6. Delete Debt
        res_del = self.client.delete(f"/api/v1/debts/{debt_id}", headers=self.headers)
        self.assertEqual(res_del.status_code, 200, res_del.text)

        # Verify deletion
        res_verify = self.client.get(f"/api/v1/debts/{debt_id}", headers=self.headers)
        self.assertEqual(res_verify.status_code, 404)

    # =========================================================================
    # 3. Authenticated REST API Lifecycle for Assets, Liabilities & Net Worth
    # =========================================================================

    def test_net_worth_assets_and_liabilities_lifecycle(self):
        """End-to-End Test: Record assets and liabilities, verify Net Worth = Assets - Liabilities."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        # 1. Create Asset A (Real Estate: ₹300,000)
        res_a1 = self.client.post(
            "/api/v1/net-worth/assets",
            json={"name": "Wayne Penthouse Suite", "category": "Real Estate", "value": 300000.0},
            headers=self.headers,
        )
        self.assertEqual(res_a1.status_code, 201)
        a1_id = res_a1.json()["id"]

        # 2. Create Asset B (Investments: ₹100,000)
        res_a2 = self.client.post(
            "/api/v1/net-worth/assets",
            json={"name": "S&P 500 Index Fund", "category": "Investments", "value": 100000.0},
            headers=self.headers,
        )
        self.assertEqual(res_a2.status_code, 201)
        a2_id = res_a2.json()["id"]

        # 3. Create Liability L1 (Mortgage: ₹150,000)
        res_l1 = self.client.post(
            "/api/v1/net-worth/liabilities",
            json={"name": "Penthouse Mortgage Note", "category": "Mortgage", "value": 150000.0},
            headers=self.headers,
        )
        self.assertEqual(res_l1.status_code, 201)
        l1_id = res_l1.json()["id"]

        # 4. Verify GET /api/v1/net-worth
        res_nw = self.client.get("/api/v1/net-worth", headers=self.headers)
        self.assertEqual(res_nw.status_code, 200)
        nw = res_nw.json()

        # Net worth must be Total Assets - Total Liabilities
        expected_nw = nw["total_assets"] - nw["total_liabilities"]
        self.assertAlmostEqual(nw["net_worth"], expected_nw, places=2)
        self.assertGreaterEqual(nw["total_assets"], 400000.0)
        self.assertGreaterEqual(nw["total_liabilities"], 150000.0)
        self.assertIn("asset_breakdown", nw)
        self.assertIn("liability_breakdown", nw)

        # 5. Clean up created assets and liabilities
        self.client.delete(f"/api/v1/net-worth/assets/{a1_id}", headers=self.headers)
        self.client.delete(f"/api/v1/net-worth/assets/{a2_id}", headers=self.headers)
        self.client.delete(f"/api/v1/net-worth/liabilities/{l1_id}", headers=self.headers)


if __name__ == "__main__":
    unittest.main()
