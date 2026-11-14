from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_auth_flow():
    # 1. Test registration with valid details
    reg_payload = {
        "name": "Sarah Connor",
        "email": "sarah.connor@example.com",
        "password": "StrongPassword123",
        "age": 29,
        "city": "Los Angeles"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "sarah.connor@example.com"
    assert data["user"]["name"] == "Sarah Connor"
    assert data["user"]["age"] == 29
    assert data["user"]["city"] == "Los Angeles"
    assert data["user"]["financial_profile"]["monthly_income"] == 0.0
    token = data["access_token"]
    print("[PASS] User registration passed.")

    # 2. Test duplicate email registration fails with 400
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400, f"Duplicate allowed: {res_dup.text}"
    print("[PASS] Duplicate email rejection passed.")

    # 3. Test weak password rejected (less than 8 chars, or no digits)
    weak_payload = reg_payload.copy()
    weak_payload["email"] = "weak@example.com"
    weak_payload["password"] = "short1"
    res_weak = client.post("/api/v1/auth/register", json=weak_payload)
    assert res_weak.status_code == 422, f"Weak password allowed: {res_weak.text}"

    weak_payload["password"] = "allcharactersnodigits"
    res_no_digits = client.post("/api/v1/auth/register", json=weak_payload)
    assert res_no_digits.status_code == 422, f"No-digits password allowed: {res_no_digits.text}"
    print("[PASS] Weak password validations passed.")

    # 4. Test invalid email rejected with 422
    invalid_email_payload = reg_payload.copy()
    invalid_email_payload["email"] = "not-an-email"
    res_inv = client.post("/api/v1/auth/register", json=invalid_email_payload)
    assert res_inv.status_code == 422, f"Invalid email allowed: {res_inv.text}"
    print("[PASS] Invalid email validation passed.")

    # 5. Test login with correct credentials
    login_payload = {
        "email": "sarah.connor@example.com",
        "password": "StrongPassword123"
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    login_data = res_login.json()
    assert "access_token" in login_data
    token = login_data["access_token"]
    print("[PASS] User login passed.")

    # 6. Test login with wrong password rejected with 401
    bad_login = {
        "email": "sarah.connor@example.com",
        "password": "WrongPassword999"
    }
    res_bad = client.post("/api/v1/auth/login", json=bad_login)
    assert res_bad.status_code == 401, f"Wrong password allowed: {res_bad.text}"
    print("[PASS] Invalid credentials rejection (401) passed.")

    # 7. Test /me endpoint with valid token
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200, f"/me failed: {res_me.text}"
    me_data = res_me.json()
    assert me_data["email"] == "sarah.connor@example.com"
    print("[PASS] Authenticated /me endpoint passed.")

    # 8. Test /me endpoint without token rejected with 401
    res_no_auth = client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 401, f"Unauthenticated access allowed: {res_no_auth.text}"
    print("[PASS] Protected route security (401) passed.")

    # 9. Test updating profile with valid financial figures
    profile_update = {
        "monthly_income": 9500.0,
        "monthly_expenses": 3800.0,
        "current_savings": 32000.0,
        "monthly_emi": 1200.0,
        "monthly_investment": 2000.0,
        "city": "San Francisco",
        "tax_regime": "new"
    }
    res_update = client.put("/api/v1/users/profile", json=profile_update, headers=headers)
    assert res_update.status_code == 200, f"Profile update failed: {res_update.text}"
    updated = res_update.json()
    assert updated["city"] == "San Francisco"
    assert updated["financial_profile"]["monthly_income"] == 9500.0
    assert updated["financial_profile"]["monthly_expenses"] == 3800.0
    assert updated["financial_profile"]["current_savings"] == 32000.0
    assert updated["financial_profile"]["monthly_emi"] == 1200.0
    assert updated["financial_profile"]["monthly_investment"] == 2000.0
    print("[PASS] Profile and financial metrics update passed.")

    # 10. Test updating profile with negative values rejected with 422
    neg_cases = [
        {"monthly_income": -500.0},
        {"monthly_expenses": -100.0},
        {"current_savings": -1000.0},
        {"monthly_emi": -50.0},
        {"monthly_investment": -200.0},
    ]
    for neg_case in neg_cases:
        res_neg = client.put("/api/v1/users/profile", json=neg_case, headers=headers)
        assert res_neg.status_code == 422, f"Negative value accepted for {neg_case}: {res_neg.text}"
    print("[PASS] Negative financial value validation (income, expense, savings, emi, investment) passed.")

    print("\nALL 10 BACKEND AUTHENTICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_complete_auth_flow()
