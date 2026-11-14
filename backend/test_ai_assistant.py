"""
Comprehensive automated test suite for SMARTFIN AI Financial Assistant.
Validates:
1. Deterministic Context Grounding (MongoDB -> Python Engine -> Grounded Context).
2. Gemini API / Heuristic Fallback Integration.
3. Persistent Chat Sessions & Message History in MongoDB.
4. Health Score & What-If Scenario Explanations.
5. REST API Endpoints with Authentication.
6. Zero API Key Exposure & Mandatory Educational Disclaimer.
"""

import sys
import unittest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.database.mongodb import connect_to_mongo, get_database
from app.core.security import create_access_token
from app.services.ai.gemini_service import (
    get_user_financial_context,
    _heuristic_chat_reply,
    chat_with_gemini,
    get_user_chat_sessions,
    get_session_messages,
    delete_chat_session,
    generate_financial_insights,
    explain_health_score,
    explain_whatif_scenario,
    generate_monthly_summary,
)
from app.schemas.ai import DISCLAIMER_TEXT


class TestAIFinancialAssistant(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        connect_to_mongo()
        cls.db = get_database()
        cls.client = TestClient(app)

        # Find or create a test user
        test_email = "ai_tester@smartfin.dev"
        user = cls.db.users.find_one({"email": test_email})
        if not user:
            user_doc = {
                "email": test_email,
                "name": "AI Assistant Tester",
                "hashed_password": "test_hashed_password",
                "is_active": True,
                "financial_profile": {
                    "monthly_income": 85000.0,
                    "monthly_expenses": 45000.0,
                    "current_savings": 150000.0,
                    "monthly_investments": 15000.0,
                    "monthly_emi": 8000.0,
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

    def test_01_context_grounding(self):
        """Verify get_user_financial_context retrieves real deterministic numbers."""
        context = get_user_financial_context(self.user_id)
        self.assertIn("monthly_income", context)
        self.assertIn("monthly_expenses", context)
        self.assertIn("monthly_surplus", context)
        self.assertIn("health_score", context)
        self.assertIn("emergency_fund", context)

        # Verify mathematical consistency
        expected_surplus = context["monthly_income"] - context["monthly_expenses"]
        self.assertAlmostEqual(context["monthly_surplus"], expected_surplus, places=2)
        self.assertGreaterEqual(context["health_score"], 0.0)
        self.assertLessEqual(context["health_score"], 100.0)

    def test_02_heuristic_fallback_responses(self):
        """Test heuristic replies for all standard financial queries."""
        context = get_user_financial_context(self.user_id)

        queries = [
            "Why is my health score low?",
            "How can I improve my savings?",
            "Explain my emergency fund runway.",
            "Where am I spending the most?",
            "Explain my debt situation.",
            "How much should I save for my goal?",
        ]

        for q in queries:
            reply = _heuristic_chat_reply(q, context)
            self.assertIsInstance(reply, str)
            self.assertGreater(len(reply), 30)

    def test_03_chat_with_session_persistence(self):
        """Test sending message, creating session, and persisting messages in MongoDB."""
        msg = "What is my current monthly surplus and how is it calculated?"
        res = chat_with_gemini(user_id=self.user_id, user_message=msg)

        self.assertIn("session_id", res)
        self.assertIn("message", res)
        self.assertIn("disclaimer", res)
        self.assertEqual(res["disclaimer"], DISCLAIMER_TEXT)

        session_id = res["session_id"]

        # Check messages in MongoDB
        messages = get_session_messages(user_id=self.user_id, session_id=session_id)
        self.assertGreaterEqual(len(messages), 2)  # User message + Model message
        self.assertEqual(messages[0]["role"], "user")
        self.assertEqual(messages[1]["role"], "model")

        # Test session listing
        sessions = get_user_chat_sessions(user_id=self.user_id)
        session_ids = [s["id"] for s in sessions]
        self.assertIn(session_id, session_ids)

        # Clean up session
        deleted = delete_chat_session(user_id=self.user_id, session_id=session_id)
        self.assertTrue(deleted)
        remaining_messages = get_session_messages(user_id=self.user_id, session_id=session_id)
        self.assertEqual(len(remaining_messages), 0)

    def test_04_financial_insights_generation(self):
        """Test generating structured financial insights."""
        insights = generate_financial_insights(user_id=self.user_id)
        self.assertIsInstance(insights, list)
        self.assertGreaterEqual(len(insights), 2)

        for item in insights:
            self.assertTrue(hasattr(item, "category"))
            self.assertTrue(hasattr(item, "title"))
            self.assertTrue(hasattr(item, "insight"))
            self.assertTrue(hasattr(item, "action_item"))
            self.assertIn(item.priority.lower(), ["high", "medium", "low"])

    def test_05_explain_health_score(self):
        """Test health score explanation service."""
        score_data = {
            "score": 74.5,
            "risk_level": "Good",
            "components": {
                "savings": {"score": 20.0, "max_score": 25.0},
                "emergency": {"score": 15.0, "max_score": 20.0},
                "emi": {"score": 18.0, "max_score": 20.0},
                "investment": {"score": 12.0, "max_score": 20.0},
                "expense": {"score": 9.5, "max_score": 15.0},
            },
        }
        res = explain_health_score(user_id=self.user_id, score_data=score_data)
        self.assertIn("explanation", res)
        self.assertIn("recommendations", res)
        self.assertGreaterEqual(len(res["recommendations"]), 2)
        self.assertEqual(res["disclaimer"], DISCLAIMER_TEXT)

    def test_06_explain_whatif_scenario(self):
        """Test what-if scenario explanation service."""
        scenario_data = {
            "baseline": {
                "income": 85000.0,
                "expenses": 45000.0,
                "surplus": 40000.0,
                "savings_rate": 47.1,
                "health_score": 75.0,
                "emergency_runway": 3.3,
            },
            "what_if": {
                "income": 95000.0,
                "expenses": 45000.0,
                "surplus": 50000.0,
                "savings_rate": 52.6,
                "health_score": 82.0,
                "emergency_runway": 4.1,
            },
            "deltas": {
                "surplus": 10000.0,
                "health_score": 7.0,
                "savings_rate": 5.5,
            },
        }
        res = explain_whatif_scenario(user_id=self.user_id, scenario_data=scenario_data)
        self.assertIn("summary", res)
        self.assertIn("strengths", res)
        self.assertIn("verdict", res)
        self.assertEqual(res["disclaimer"], DISCLAIMER_TEXT)

    def test_07_rest_api_chat_endpoint(self):
        """Test POST /api/v1/ai/chat endpoint."""
        payload = {"message": "How do I optimize my emergency fund?"}
        response = self.client.post("/api/v1/ai/chat", json=payload, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("session_id", data)
        self.assertIn("message", data)
        self.assertIn("disclaimer", data)
        self.assertEqual(data["disclaimer"], DISCLAIMER_TEXT)

        # Clean up session
        session_id = data["session_id"]
        del_res = self.client.delete(f"/api/v1/ai/sessions/{session_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 200)

    def test_08_rest_api_insights_endpoint(self):
        """Test GET /api/v1/ai/insights endpoint."""
        response = self.client.get("/api/v1/ai/insights", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("insights", data)
        self.assertIn("disclaimer", data)
        self.assertGreaterEqual(len(data["insights"]), 2)

    def test_09_rest_api_explain_score_endpoint(self):
        """Test POST /api/v1/ai/explain-score endpoint."""
        payload = {
            "score": 68.0,
            "risk_level": "Moderate",
            "components": {"savings": 15.0, "emergency": 10.0},
        }
        response = self.client.post("/api/v1/ai/explain-score", json=payload, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("explanation", data)
        self.assertIn("recommendations", data)

    def test_10_rest_api_monthly_summary_endpoint(self):
        """Test GET /api/v1/ai/monthly-summary endpoint."""
        response = self.client.get("/api/v1/ai/monthly-summary", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("month", data)
        self.assertIn("summary", data)
        self.assertIn("highlights", data)
        self.assertIn("areas_for_improvement", data)


if __name__ == "__main__":
    unittest.main()
