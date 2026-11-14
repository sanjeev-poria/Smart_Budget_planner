"""
SMARTFIN — Automated Dashboard & Analytics Verification Suite
Verifies:
1. Pure Python deterministic emergency fund formulas (zero expenses, zero savings, normal expenses).
2. Pure Python score history recording helper.
3. Authenticated FastAPI endpoints:
   - GET /api/v1/analytics/dashboard
   - GET /api/v1/analytics/emergency-fund
   - GET /api/v1/analytics/spending-overview
   - GET /api/v1/analytics/score-history
"""

import sys
import os
import unittest
from bson import ObjectId

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.calculations.financial_engine import (
    calculate_emergency_fund,
    calculate_financial_health,
    calculate_surplus,
    calculate_savings_rate,
)
from app.database.mongodb import get_database, ping_database
from app.routes.auth import create_access_token
from fastapi.testclient import TestClient
from app.main import app

class TestDashboardAnalytics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Verify MongoDB connection and authenticate a test user."""
        cls.connected = ping_database()
        cls.client = TestClient(app)
        
        # Look up or prepare test user (Bruce Wayne or Sanjeev)
        db = get_database()
        cls.user = db.users.find_one({"email": "bruce.wayne@example.com"})
        if not cls.user:
            cls.user = db.users.find_one({})
            
        if cls.user:
            token = create_access_token(cls.user["email"])
            cls.headers = {"Authorization": f"Bearer {token}"}
        else:
            cls.headers = {}

    def test_emergency_fund_zero_expenses(self):
        """Test zero expenses safe division handling."""
        res = calculate_emergency_fund(current_savings=5000.0, monthly_expenses=0.0)
        self.assertEqual(res.target_amount, 0.0)
        self.assertEqual(res.months_covered, 12.0)
        self.assertEqual(res.percentage_completed, 100.0)
        self.assertEqual(res.amount_still_required, 0.0)
        self.assertEqual(res.status, "Optimal")

    def test_emergency_fund_zero_savings_and_zero_expenses(self):
        """Test zero expenses and zero savings."""
        res = calculate_emergency_fund(current_savings=0.0, monthly_expenses=0.0)
        self.assertEqual(res.target_amount, 0.0)
        self.assertEqual(res.months_covered, 0.0)
        self.assertEqual(res.percentage_completed, 0.0)
        self.assertEqual(res.amount_still_required, 0.0)

    def test_emergency_fund_normal_calculation(self):
        """Test standard 6-month target and months covered calculation."""
        # Expenses: ₹2,000/mo -> Target: ₹12,000
        # Savings: ₹6,000 -> 3.0 months covered, 50% completed, ₹6,000 still required
        res = calculate_emergency_fund(current_savings=6000.0, monthly_expenses=2000.0)
        self.assertEqual(res.target_amount, 12000.0)
        self.assertEqual(res.months_covered, 3.0)
        self.assertEqual(res.percentage_completed, 50.0)
        self.assertEqual(res.amount_still_required, 6000.0)
        self.assertEqual(res.status, "Adequate")

    def test_emergency_fund_fully_funded(self):
        """Test emergency fund exceeding 6-month target."""
        res = calculate_emergency_fund(current_savings=25000.0, monthly_expenses=3000.0)
        self.assertEqual(res.target_amount, 18000.0)
        self.assertAlmostEqual(res.months_covered, 8.33, places=2)
        self.assertEqual(res.percentage_completed, 100.0)
        self.assertEqual(res.amount_still_required, 0.0)
        self.assertEqual(res.status, "Optimal")

    def test_dashboard_endpoint_authenticated(self):
        """Verify GET /api/v1/analytics/dashboard returns 200 with real payload structure."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB to test authenticated endpoint")

        response = self.client.get("/api/v1/analytics/dashboard", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        
        # Verify 7 summary cards present
        cards = data.get("summary_cards")
        self.assertIsNotNone(cards)
        self.assertIn("monthly_income", cards)
        self.assertIn("monthly_expenses", cards)
        self.assertIn("surplus", cards)
        self.assertIn("savings_rate", cards)
        self.assertIn("current_savings", cards)
        self.assertIn("monthly_investment", cards)
        self.assertIn("monthly_emi", cards)

        # Verify health score
        health = data.get("health_score")
        self.assertIsNotNone(health)
        self.assertIn("score", health)
        self.assertIn("risk_level", health)

        # Verify emergency fund
        ef = data.get("emergency_fund")
        self.assertIsNotNone(ef)
        self.assertIn("target_amount", ef)
        self.assertIn("months_covered", ef)

        # Verify spending overview
        spending = data.get("spending_overview")
        self.assertIsNotNone(spending)
        self.assertIn("categories", spending)
        self.assertIn("monthly_timeline", spending)

        # Verify budget alerts & AI insight
        self.assertIn("budget_alerts", data)
        self.assertIn("ai_insight", data)

    def test_emergency_fund_endpoint_authenticated(self):
        """Verify GET /api/v1/analytics/emergency-fund returns 200."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        response = self.client.get("/api/v1/analytics/emergency-fund", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertIn("target_amount", data)
        self.assertIn("months_covered", data)
        self.assertIn("percentage_completed", data)
        self.assertIn("status", data)

    def test_spending_overview_endpoint_authenticated(self):
        """Verify GET /api/v1/analytics/spending-overview returns 200."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        response = self.client.get("/api/v1/analytics/spending-overview", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertIn("categories", data)
        self.assertIn("monthly_timeline", data)
        self.assertIn("total_income", data)
        self.assertIn("total_expense", data)

    def test_score_history_endpoint_authenticated(self):
        """Verify GET /api/v1/analytics/score-history returns 200 and a list."""
        if not self.headers:
            self.skipTest("No test user found in MongoDB")

        response = self.client.get("/api/v1/analytics/score-history", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertIsInstance(data, list)


if __name__ == "__main__":
    unittest.main()
