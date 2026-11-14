"""
Automated unit and integration test suite for SMARTFIN Monthly Financial Report System.
Validates:
1. 11-section multi-module report data compilation.
2. ReportLab PDF engine binary generation and page layout.
3. MongoDB monthly_reports collection persistence.
4. Report generation, history listing, live preview, and PDF download REST endpoints.
"""

import unittest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.database.mongodb import connect_to_mongo, get_database
from app.core.security import create_access_token
from app.services.report_service import (
    compile_monthly_report_data,
    generate_and_save_report,
    get_user_report_history,
    get_report_by_id,
    get_report_pdf_bytes,
    delete_report,
)
from app.services.calculations.report_engine import build_monthly_financial_pdf


class TestMonthlyReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        connect_to_mongo()
        cls.db = get_database()
        cls.client = TestClient(app)

        test_email = "report_tester@smartfin.dev"
        user = cls.db.users.find_one({"email": test_email})
        if not user:
            user_doc = {
                "email": test_email,
                "name": "Report System Tester",
                "hashed_password": "test_hashed_password",
                "is_active": True,
                "financial_profile": {
                    "monthly_income": 90000.0,
                    "monthly_expenses": 48000.0,
                    "current_savings": 200000.0,
                    "monthly_investments": 18000.0,
                    "monthly_emi": 9000.0,
                    "risk_tolerance": "Moderate",
                    "currency": "INR",
                },
            }
            res = cls.db.users.insert_one(user_doc)
            user_doc["_id"] = res.inserted_id
            user = user_doc

        cls.user_id = user["_id"]
        cls.token = create_access_token(subject=test_email)
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}

    def test_01_compile_monthly_report_data(self):
        """Verify all 11 required report sections are aggregated accurately."""
        data = compile_monthly_report_data(user_id=self.user_id, month=9, year=2026)

        required_sections = [
            "user_overview",
            "financial_summary",
            "financial_health_score",
            "spending_analysis",
            "emergency_fund",
            "goals",
            "investments",
            "debts",
            "net_worth",
            "budgets",
            "ai_insights",
        ]
        for section in required_sections:
            self.assertIn(section, data, f"Missing section: {section}")

        # Check math consistency
        fin = data["financial_summary"]
        self.assertAlmostEqual(fin["surplus"], fin["income"] - fin["expenses"], places=2)
        self.assertGreaterEqual(data["financial_health_score"]["score"], 0)
        self.assertLessEqual(data["financial_health_score"]["score"], 100)

    def test_02_reportlab_pdf_generation(self):
        """Verify ReportLab builds a valid PDF binary starting with %PDF-."""
        data = compile_monthly_report_data(user_id=self.user_id, month=9, year=2026)
        pdf_bytes = build_monthly_financial_pdf(data)

        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 3000)

    def test_03_generate_and_save_report(self):
        """Verify report creation and MongoDB persistence."""
        report = generate_and_save_report(user_id=self.user_id, month=9, year=2026)

        self.assertIn("id", report)
        self.assertEqual(report["month"], 9)
        self.assertEqual(report["year"], 2026)
        self.assertIn("Monthly Financial Statement", report["report_title"])
        self.assertIn("summary_metrics", report)
        self.assertIn("health_score", report["summary_metrics"])

        # Check in MongoDB
        doc = self.db.monthly_reports.find_one({"_id": ObjectId(report["id"])})
        self.assertIsNotNone(doc)

        # Cleanup
        self.db.monthly_reports.delete_one({"_id": ObjectId(report["id"])})

    def test_04_report_history_and_pdf_download(self):
        """Test listing report history and fetching PDF stream bytes."""
        report = generate_and_save_report(user_id=self.user_id, month=8, year=2026)
        report_id = report["id"]

        history = get_user_report_history(user_id=self.user_id)
        report_ids = [r["id"] for r in history]
        self.assertIn(report_id, report_ids)

        res = get_report_pdf_bytes(user_id=self.user_id, report_id=report_id)
        self.assertIsNotNone(res)
        pdf_bytes, filename = res
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertTrue(filename.endswith(".pdf"))

        deleted = delete_report(user_id=self.user_id, report_id=report_id)
        self.assertTrue(deleted)

    def test_05_rest_api_generate_and_history(self):
        """Test POST /api/v1/reports/generate and GET /api/v1/reports/history."""
        payload = {"month": 9, "year": 2026}
        response = self.client.post("/api/v1/reports/generate", json=payload, headers=self.auth_headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        report_id = data["id"]

        # History
        hist_res = self.client.get("/api/v1/reports/history", headers=self.auth_headers)
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()
        self.assertIn("reports", hist_data)
        self.assertGreaterEqual(hist_data["total"], 1)

        # Clean up
        self.client.delete(f"/api/v1/reports/{report_id}", headers=self.auth_headers)

    def test_06_rest_api_download_pdf(self):
        """Test GET /api/v1/reports/{id}/download returns application/pdf."""
        gen_res = self.client.post("/api/v1/reports/generate", json={"month": 9, "year": 2026}, headers=self.auth_headers)
        self.assertEqual(gen_res.status_code, 201)
        report_id = gen_res.json()["id"]

        download_res = self.client.get(f"/api/v1/reports/{report_id}/download", headers=self.auth_headers)
        self.assertEqual(download_res.status_code, 200)
        self.assertEqual(download_res.headers["content-type"], "application/pdf")
        self.assertTrue(download_res.content.startswith(b"%PDF-"))
        self.assertIn("attachment; filename=", download_res.headers.get("content-disposition", ""))

        # Clean up
        self.client.delete(f"/api/v1/reports/{report_id}", headers=self.auth_headers)

    def test_07_rest_api_live_preview(self):
        """Test GET /api/v1/reports/preview/live returns full structured JSON."""
        response = self.client.get("/api/v1/reports/preview/live?month=9&year=2026", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user_overview", data)
        self.assertIn("financial_summary", data)
        self.assertIn("financial_health_score", data)
        self.assertIn("spending_analysis", data)
        self.assertIn("emergency_fund", data)
        self.assertIn("goals", data)
        self.assertIn("investments", data)
        self.assertIn("debts", data)
        self.assertIn("net_worth", data)
        self.assertIn("budgets", data)
        self.assertIn("ai_insights", data)
        self.assertIn("disclaimer", data)


if __name__ == "__main__":
    unittest.main()
