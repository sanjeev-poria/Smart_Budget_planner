"""
Automated Integration and Unit Test Suite for Budget Management and Tax Center.
Validates:
1. Budget mathematical engine (usage %, remaining, Safe/Warning/Exceeded statuses).
2. India Section 80C cap math and category attribution (PPF, ELSS, LIC, NSC, EPF).
3. Pure Python New vs Old Regime tax slabs and 87A rebate calculation.
4. Live authenticated MongoDB CRUD for Budgets with live transaction aggregation.
5. Live authenticated MongoDB CRUD for Tax Investments with 80C summary computation.
"""

import sys
import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from bson import ObjectId

from app.main import app
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
from app.core.security import create_access_token
from app.database.mongodb import get_database


class TestBudgetAndTaxEngines(unittest.TestCase):

    def test_budget_metrics_math(self):
        """Verify budget_usage = category_spending / monthly_budget * 100 and status thresholds."""
        # 1. Safe (< 80%)
        usage, remaining, status = calculate_budget_metrics(1000.0, 450.0)
        self.assertEqual(usage, 45.0)
        self.assertEqual(remaining, 550.0)
        self.assertEqual(status, "Safe")

        # 2. Warning (80% to 100%)
        usage, remaining, status = calculate_budget_metrics(1000.0, 850.0)
        self.assertEqual(usage, 85.0)
        self.assertEqual(remaining, 150.0)
        self.assertEqual(status, "Warning")

        usage_100, rem_0, status_warn = calculate_budget_metrics(1000.0, 1000.0)
        self.assertEqual(usage_100, 100.0)
        self.assertEqual(rem_0, 0.0)
        self.assertEqual(status_warn, "Warning")

        # 3. Exceeded (> 100%)
        usage, remaining, status = calculate_budget_metrics(1000.0, 1250.0)
        self.assertEqual(usage, 125.0)
        self.assertEqual(remaining, -250.0)
        self.assertEqual(status, "Exceeded")

        # Edge cases: 0 spending, 0 budget
        usage_zero, rem_zero, status_zero = calculate_budget_metrics(500.0, 0.0)
        self.assertEqual(usage_zero, 0.0)
        self.assertEqual(rem_zero, 500.0)
        self.assertEqual(status_zero, "Safe")

        usage_nobudget, rem_nobudget, status_nobudget = calculate_budget_metrics(0.0, 100.0)
        self.assertEqual(status_nobudget, "Exceeded")

    def test_tax_80c_summary_and_caps(self):
        """Verify Section 80C calculation caps strictly at ₹1,50,000."""
        # Test 1: Below cap (PPF 50k, ELSS 60k = 110k)
        investments_1 = [
            {"category": "PPF", "section": "80C", "amount": 50000.0},
            {"category": "ELSS", "section": "80C", "amount": 60000.0},
        ]
        res1 = compute_80c_summary(investments_1)
        self.assertEqual(res1["total_eligible_80c"], 110000.0)
        self.assertEqual(res1["allowable_deduction_80c"], 110000.0)
        self.assertEqual(res1["remaining_80c_limit"], 40000.0)
        self.assertAlmostEqual(res1["utilization_percentage"], 73.33, places=2)
        self.assertEqual(res1["category_breakdown"]["PPF"], 50000.0)
        self.assertEqual(res1["category_breakdown"]["ELSS"], 60000.0)

        # Test 2: Above cap (PPF 100k, ELSS 80k, EPF 40k = 220k)
        investments_2 = [
            {"category": "PPF", "section": "80C", "amount": 100000.0},
            {"category": "ELSS", "section": "80C", "amount": 80000.0},
            {"category": "EPF", "section": "80C", "amount": 40000.0},
        ]
        res2 = compute_80c_summary(investments_2)
        self.assertEqual(res2["total_eligible_80c"], 220000.0)
        self.assertEqual(res2["allowable_deduction_80c"], 150000.0)  # Capped at ₹1.5L
        self.assertEqual(res2["remaining_80c_limit"], 0.0)
        self.assertEqual(res2["utilization_percentage"], 100.0)

    def test_tax_regime_deterministic_math(self):
        """Verify New vs Old tax slabs, standard deductions, 87A rebate, and cess."""
        # Case A: Low income (₹6,00,000) -> Rebate u/s 87A makes tax NIL under both
        new_tax_6L = compute_new_regime_tax(600000.0)
        self.assertEqual(new_tax_6L["taxable_income"], 525000.0)  # 6L - 75k
        self.assertEqual(new_tax_6L["total_tax_payable"], 0.0)  # Nil tax due to 87A rebate (threshold 7L)

        old_tax_5L = compute_old_regime_tax(550000.0, 0.0)
        self.assertEqual(old_tax_5L["taxable_income"], 500000.0)  # 5.5L - 50k
        self.assertEqual(old_tax_5L["total_tax_payable"], 0.0)  # Nil tax due to 87A rebate (threshold 5L)

        # Case B: ₹12,00,000 Gross Income
        # New Regime: Std Ded 75k -> Taxable 11,25,000
        # 0-3L: 0, 3-7L: 20k, 7-10L: 30k, 10-11.25L: 15% of 1.25L = 18,750 -> Base = 68,750
        # Cess: 4% of 68,750 = 2,750 -> Total = 71,500
        new_tax_12L = compute_new_regime_tax(1200000.0)
        self.assertEqual(new_tax_12L["taxable_income"], 1125000.0)
        self.assertEqual(new_tax_12L["base_tax"], 68750.0)
        self.assertEqual(new_tax_12L["cess"], 2750.0)
        self.assertEqual(new_tax_12L["total_tax_payable"], 71500.0)

        # Old Regime with ₹2,00,000 Deductions:
        # Std Ded 50k + Deductions 200k = Total Exemptions 250k -> Taxable 9,50,000
        # 0-2.5L: 0, 2.5-5L: 12.5k, 5-9.5L: 20% of 4.5L = 90k -> Base = 102,500
        # Cess: 4% of 102,500 = 4,100 -> Total = 106,600
        old_tax_12L = compute_old_regime_tax(1200000.0, 200000.0)
        self.assertEqual(old_tax_12L["taxable_income"], 950000.0)
        self.assertEqual(old_tax_12L["base_tax"], 102500.0)
        self.assertEqual(old_tax_12L["cess"], 4100.0)
        self.assertEqual(old_tax_12L["total_tax_payable"], 106600.0)

        # Comparison: New regime is cheaper by ₹35,100
        comp = compare_tax_regimes(1200000.0, 200000.0, "2025-26")
        self.assertEqual(comp["recommended_regime"], "New Regime")
        self.assertEqual(comp["tax_difference"], 35100.0)


class TestBudgetAndTaxLiveAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        db = get_database()
        cls.users_col = db.users
        cls.transactions_col = db.transactions
        cls.budgets_col = db.budgets
        cls.tax_col = db.tax_investments

        cls.test_email = "tax_budget_tester@smartfin.dev"
        cls.users_col.delete_many({"email": cls.test_email})

        cls.user_id = ObjectId()
        user_doc = {
            "_id": cls.user_id,
            "name": "Tax Budget Tester",
            "email": cls.test_email,
            "password_hash": "$2b$12$MockHashForTestingOnly...",
            "age": 30,
            "city": "Bengaluru",
            "monthly_income": 100000.0,
            "monthly_expenses": 50000.0,
            "current_savings": 200000.0,
            "monthly_investment": 20000.0,
            "emi": 15000.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        cls.users_col.insert_one(user_doc)
        cls.token = create_access_token(cls.test_email)
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    @classmethod
    def tearDownClass(cls):
        cls.users_col.delete_many({"_id": cls.user_id})
        cls.budgets_col.delete_many({"user_id": cls.user_id})
        cls.tax_col.delete_many({"user_id": cls.user_id})
        cls.transactions_col.delete_many({"user_id": cls.user_id})

    def test_live_budget_crud_and_spending_aggregation(self):
        """Test creating a budget, inserting transactions, and verifying live adherence calculation."""
        now = datetime.now(timezone.utc)
        curr_m = now.month
        curr_y = now.year

        # 1. Create a Budget: Food limit 1000
        budget_payload = {
            "category": "Food",
            "monthly_limit": 1000.0,
            "month": curr_m,
            "year": curr_y,
        }
        create_res = self.client.post("/api/v1/budgets", json=budget_payload, headers=self.headers)
        self.assertEqual(create_res.status_code, 201)
        budget_data = create_res.json()
        b_id = budget_data["id"]
        self.assertEqual(budget_data["category"], "Food")
        self.assertEqual(budget_data["monthly_limit"], 1000.0)
        self.assertEqual(budget_data["amount_spent"], 0.0)
        self.assertEqual(budget_data["status"], "Safe")

        # 2. Add Transaction in Food category
        tx_date = f"{curr_y:04d}-{curr_m:02d}-10"
        tx_payload = {
            "amount": 850.0,
            "type": "expense",
            "category": "Food",
            "date": tx_date,
            "description": "Weekly groceries",
        }
        tx_res = self.client.post("/api/v1/transactions", json=tx_payload, headers=self.headers)
        self.assertEqual(tx_res.status_code, 201)

        # 3. Fetch budget overview: Food should now reflect 850 spent, 85% usage, Warning status
        overview_res = self.client.get(f"/api/v1/budgets?month={curr_m}&year={curr_y}", headers=self.headers)
        self.assertEqual(overview_res.status_code, 200)
        overview = overview_res.json()
        self.assertEqual(overview["total_budgeted"], 1000.0)
        self.assertEqual(overview["total_spent"], 850.0)
        self.assertEqual(overview["total_remaining"], 150.0)
        self.assertEqual(overview["warning_count"], 1)

        food_budget = next(b for b in overview["budgets"] if b["category"] == "Food")
        self.assertEqual(food_budget["amount_spent"], 850.0)
        self.assertEqual(food_budget["budget_usage"], 85.0)
        self.assertEqual(food_budget["status"], "Warning")

        # 4. Add another expense to push it past limit -> 850 + 200 = 1050 spent -> Exceeded
        tx_payload2 = {
            "amount": 200.0,
            "type": "expense",
            "category": "Food",
            "date": tx_date,
            "description": "Dinner with friends",
        }
        self.client.post("/api/v1/transactions", json=tx_payload2, headers=self.headers)

        overview_res2 = self.client.get(f"/api/v1/budgets?month={curr_m}&year={curr_y}", headers=self.headers)
        overview2 = overview_res2.json()
        food_budget2 = next(b for b in overview2["budgets"] if b["category"] == "Food")
        self.assertEqual(food_budget2["amount_spent"], 1050.0)
        self.assertEqual(food_budget2["budget_usage"], 105.0)
        self.assertEqual(food_budget2["status"], "Exceeded")

        # 5. Delete the budget
        del_res = self.client.delete(f"/api/v1/budgets/{b_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

    def test_live_tax_crud_and_overview(self):
        """Test fetching tax config, adding PPF and ELSS investments, and checking 80C summary."""
        # 1. Fetch Tax Config
        cfg_res = self.client.get("/api/v1/tax/config")
        self.assertEqual(cfg_res.status_code, 200)
        cfg = cfg_res.json()
        self.assertEqual(cfg["section_80c_limit"], 150000.0)
        self.assertTrue(len(cfg["supported_categories"]) >= 5)
        self.assertIn("Disclaimer", cfg["disclaimer"])

        # 2. Add PPF Investment ₹60,000
        ppf_payload = {
            "financial_year": "2025-26",
            "category": "PPF",
            "section": "80C",
            "name": "State Bank of India PPF",
            "amount": 60000.0,
            "notes": "Annual contribution",
        }
        res_ppf = self.client.post("/api/v1/tax/investments", json=ppf_payload, headers=self.headers)
        self.assertEqual(res_ppf.status_code, 201)
        ppf_id = res_ppf.json()["id"]

        # 3. Add ELSS Investment ₹50,000
        elss_payload = {
            "financial_year": "2025-26",
            "category": "ELSS",
            "section": "80C",
            "name": "Mirae Asset ELSS Tax Saver",
            "amount": 50000.0,
            "notes": "SIP lumpsum",
        }
        res_elss = self.client.post("/api/v1/tax/investments", json=elss_payload, headers=self.headers)
        self.assertEqual(res_elss.status_code, 201)
        elss_id = res_elss.json()["id"]

        # 4. Fetch Tax Overview
        overview_res = self.client.get("/api/v1/tax/overview?financial_year=2025-26", headers=self.headers)
        self.assertEqual(overview_res.status_code, 200)
        overview = overview_res.json()

        # 80C Summary: 60k + 50k = 110k eligible, 110k allowable, 40k remaining
        summary_80c = overview["summary_80c"]
        self.assertEqual(summary_80c["total_eligible_80c"], 110000.0)
        self.assertEqual(summary_80c["allowable_deduction_80c"], 110000.0)
        self.assertEqual(summary_80c["remaining_80c_limit"], 40000.0)
        self.assertAlmostEqual(summary_80c["utilization_percentage"], 73.33, places=2)
        self.assertIn("disclaimer", overview)
        self.assertTrue(len(overview["investments"]) >= 2)

        # 5. Interactive scenario comparison
        compare_payload = {"annual_gross_income": 1500000.0, "financial_year": "2025-26"}
        comp_res = self.client.post("/api/v1/tax/compare", json=compare_payload, headers=self.headers)
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.json()
        self.assertEqual(comp_data["gross_annual_income"], 1500000.0)
        self.assertIn("recommended_regime", comp_data)

        # Cleanup
        self.client.delete(f"/api/v1/tax/investments/{ppf_id}", headers=self.headers)
        self.client.delete(f"/api/v1/tax/investments/{elss_id}", headers=self.headers)


if __name__ == "__main__":
    unittest.main()
