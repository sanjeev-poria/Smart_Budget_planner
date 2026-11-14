from fastapi.testclient import TestClient
from app.main import app
from app.services.calculations.financial_engine import (
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_runway,
    calculate_financial_health,
    determine_risk_level,
)

client = TestClient(app)


def test_deterministic_engine_units():
    print("\n--- 1. Testing Deterministic Financial Calculations ---")

    # Surplus tests
    assert calculate_surplus(5000, 3000) == 2000.0
    assert calculate_surplus(2000, 3500) == -1500.0
    assert calculate_surplus(0, 500) == -500.0
    print("[PASS] calculate_surplus passed.")

    # Savings rate tests & income = 0 safety
    assert calculate_savings_rate(5000, 3000) == 40.0
    assert calculate_savings_rate(5000, 5000) == 0.0
    assert calculate_savings_rate(5000, 6000) == 0.0  # negative surplus clamped to 0% savings rate
    assert calculate_savings_rate(0, 500) == 0.0      # Safe zero-division guard
    assert calculate_savings_rate(-100, 500) == 0.0   # Negative income guard
    print("[PASS] calculate_savings_rate with income=0 safety passed.")

    # Emergency runway tests
    assert calculate_emergency_runway(18000, 3000, 0) == 6.0
    assert calculate_emergency_runway(12000, 2500, 500) == 4.0
    assert calculate_emergency_runway(0, 3000, 500) == 0.0
    assert calculate_emergency_runway(5000, 0, 0) == 12.0  # safe when zero outflow
    print("[PASS] calculate_emergency_runway passed.")

    # Financial health score boundary & pillar tests
    # Excellent profile (High savings, 6+ mo runway, low DTI, high investment, low expense ratio)
    health_high = calculate_financial_health(
        monthly_income=10000.0,
        monthly_expenses=3500.0,
        current_savings=30000.0,
        monthly_emi=1000.0,
        monthly_investment=2000.0,
    )
    assert 80 <= health_high.health_score <= 100
    assert health_high.risk_level == "Low Risk / Excellent"
    assert len(health_high.pillars) == 5
    assert health_high.surplus == 6500.0
    assert health_high.savings_rate == 65.0
    print(f"[PASS] Excellent profile score: {health_high.health_score} ({health_high.risk_level}).")

    # Moderate profile (Medium Risk / Good)
    health_mid = calculate_financial_health(
        monthly_income=5000.0,
        monthly_expenses=3200.0,
        current_savings=8000.0,
        monthly_emi=1200.0,
        monthly_investment=300.0,
    )
    assert 60 <= health_mid.health_score <= 79
    assert health_mid.risk_level == "Medium Risk / Good"
    print(f"[PASS] Moderate profile score: {health_mid.health_score} ({health_mid.risk_level}).")

    # Stressed profile (High Risk / Needs Attention)
    health_low = calculate_financial_health(
        monthly_income=3000.0,
        monthly_expenses=2800.0,
        current_savings=500.0,
        monthly_emi=1800.0,
        monthly_investment=0.0,
    )
    assert 0 <= health_low.health_score <= 59
    assert health_low.risk_level == "High Risk / Needs Attention"
    print(f"[PASS] Stressed profile score: {health_low.health_score} ({health_low.risk_level}).")

    # Extreme edge case: All zeros
    health_zero = calculate_financial_health(
        monthly_income=0.0,
        monthly_expenses=0.0,
        current_savings=0.0,
        monthly_emi=0.0,
        monthly_investment=0.0,
    )
    assert 0 <= health_zero.health_score <= 100
    assert health_zero.risk_level in ["High Risk / Needs Attention", "Medium Risk / Good"]
    print(f"[PASS] Zero inputs handled safely: {health_zero.health_score} ({health_zero.risk_level}).")


def test_transactions_crud_and_security():
    print("\n--- 2. Testing Transaction CRUD & Isolation ---")

    # Setup User A
    user_a_email = "tx_user_a@example.com"
    reg_a = client.post("/api/v1/auth/register", json={
        "name": "User Alpha",
        "email": user_a_email,
        "password": "Password123",
        "age": 30,
        "city": "Boston"
    })
    if reg_a.status_code == 201:
        token_a = reg_a.json()["access_token"]
    else:
        login_a = client.post("/api/v1/auth/login", json={"email": user_a_email, "password": "Password123"})
        token_a = login_a.json()["access_token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup User B
    user_b_email = "tx_user_b@example.com"
    reg_b = client.post("/api/v1/auth/register", json={
        "name": "User Beta",
        "email": user_b_email,
        "password": "Password123",
        "age": 28,
        "city": "Austin"
    })
    if reg_b.status_code == 201:
        token_b = reg_b.json()["access_token"]
    else:
        login_b = client.post("/api/v1/auth/login", json={"email": user_b_email, "password": "Password123"})
        token_b = login_b.json()["access_token"]

    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Validation Failures
    # Negative amount
    res_neg = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": -50.0,
        "type": "expense",
        "category": "Food",
        "date": "2026-09-21",
        "description": "Lunch"
    })
    assert res_neg.status_code == 422, f"Negative amount allowed: {res_neg.text}"

    # Missing amount
    res_no_amt = client.post("/api/v1/transactions", headers=headers_a, json={
        "type": "expense",
        "category": "Food",
        "date": "2026-09-21",
        "description": "Lunch"
    })
    assert res_no_amt.status_code == 422, f"Missing amount allowed: {res_no_amt.text}"

    # Missing category
    res_no_cat = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 25.0,
        "type": "expense",
        "category": "",
        "date": "2026-09-21",
        "description": "Lunch"
    })
    assert res_no_cat.status_code == 422, f"Empty category allowed: {res_no_cat.text}"

    # Invalid date
    res_bad_date = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 25.0,
        "type": "expense",
        "category": "Food",
        "date": "not-a-date",
        "description": "Lunch"
    })
    assert res_bad_date.status_code == 422, f"Invalid date allowed: {res_bad_date.text}"

    # Invalid type
    res_bad_type = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 25.0,
        "type": "transfer",
        "category": "Food",
        "date": "2026-09-21",
        "description": "Lunch"
    })
    assert res_bad_type.status_code == 422, f"Invalid type allowed: {res_bad_type.text}"
    print("[PASS] Transaction validation errors (negative, missing, invalid date/type) properly rejected with 422.")

    # 2. Add Valid Transactions for User A
    tx1 = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 4500.0,
        "type": "income",
        "category": "Salary",
        "date": "2026-09-01",
        "description": "Monthly Salary Direct Deposit"
    }).json()
    assert tx1["amount"] == 4500.0
    assert tx1["type"] == "income"

    tx2 = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 120.50,
        "type": "expense",
        "category": "Food",
        "date": "2026-09-05",
        "description": "Trader Joes Groceries"
    }).json()

    tx3 = client.post("/api/v1/transactions", headers=headers_a, json={
        "amount": 85.00,
        "type": "expense",
        "category": "Transport",
        "date": "2026-09-12",
        "description": "Monthly Transit Pass"
    }).json()

    print("[PASS] Add transactions passed.")

    # 3. List Transactions & Verify Filtering & Summary
    res_list = client.get("/api/v1/transactions", headers=headers_a).json()
    assert res_list["total"] >= 3
    assert res_list["summary"]["total_income"] >= 4500.0
    assert res_list["summary"]["total_expense"] >= 205.50
    assert res_list["summary"]["net_balance"] == round(res_list["summary"]["total_income"] - res_list["summary"]["total_expense"], 2)

    # Filter by category
    res_cat = client.get("/api/v1/transactions?category=Food", headers=headers_a).json()
    for item in res_cat["items"]:
        assert item["category"] == "Food"

    # Filter by type
    res_income = client.get("/api/v1/transactions?type=income", headers=headers_a).json()
    for item in res_income["items"]:
        assert item["type"] == "income"

    # Search filter
    res_search = client.get("/api/v1/transactions?search=Trader", headers=headers_a).json()
    assert len(res_search["items"]) >= 1
    assert "Trader" in res_search["items"][0]["description"]
    print("[PASS] Transaction listing, filters, search, and summary totals passed.")

    # 4. Edit Transaction
    tx2_id = tx2["id"]
    res_update = client.put(f"/api/v1/transactions/{tx2_id}", headers=headers_a, json={
        "amount": 135.00,
        "description": "Trader Joes Groceries & Snacks"
    })
    assert res_update.status_code == 200
    assert res_update.json()["amount"] == 135.00
    assert res_update.json()["description"] == "Trader Joes Groceries & Snacks"
    print("[PASS] Edit transaction passed.")

    # 5. Unauthorized Cross-User Access Checks
    # User B tries to view User A's transaction -> 404
    res_cross_view = client.get(f"/api/v1/transactions/{tx2_id}", headers=headers_b)
    assert res_cross_view.status_code == 404, "User B was able to view User A transaction!"

    # User B tries to edit User A's transaction -> 404
    res_cross_edit = client.put(f"/api/v1/transactions/{tx2_id}", headers=headers_b, json={"amount": 999.0})
    assert res_cross_edit.status_code == 404, "User B was able to edit User A transaction!"

    # User B tries to delete User A's transaction -> 404
    res_cross_del = client.delete(f"/api/v1/transactions/{tx2_id}", headers=headers_b)
    assert res_cross_del.status_code == 404, "User B was able to delete User A transaction!"
    print("[PASS] Unauthorized cross-user transaction access properly denied (404).")

    # 6. Delete Transaction by Owner
    res_del = client.delete(f"/api/v1/transactions/{tx2_id}", headers=headers_a)
    assert res_del.status_code == 200
    # Verify it is gone
    res_check = client.get(f"/api/v1/transactions/{tx2_id}", headers=headers_a)
    assert res_check.status_code == 404
    print("[PASS] Delete transaction passed.")

    # 7. Test Analytics Endpoints
    res_health_api = client.get("/api/v1/analytics/financial-health", headers=headers_a)
    assert res_health_api.status_code == 200
    data_health = res_health_api.json()
    assert "health_score" in data_health
    assert "risk_level" in data_health
    assert len(data_health["pillars"]) == 5

    res_summary_api = client.get("/api/v1/analytics/summary", headers=headers_a)
    assert res_summary_api.status_code == 200
    data_sum = res_summary_api.json()
    assert "surplus" in data_sum
    assert "recorded_transactions_inflow" in data_sum

    print("[PASS] /api/v1/analytics/financial-health and /api/v1/analytics/summary passed.")
    print("\nALL DETERMINISTIC CALCULATION AND TRANSACTION TESTS PASSED!")


if __name__ == "__main__":
    test_deterministic_engine_units()
    test_transactions_crud_and_security()
