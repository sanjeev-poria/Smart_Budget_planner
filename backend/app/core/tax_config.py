"""
India-Oriented Tax Configuration & Statutory Rules.
Centralizes all tax parameters, Section 80C rules, deductions, and slab rates
so they are never hardcoded or scattered across the system.
"""

from typing import Any, Dict, List

# Section Limits (in Indian Rupees INR)
SECTION_80C_MAX_LIMIT = 150000.0  # 1.5 Lakhs
SECTION_80CCD_1B_MAX_LIMIT = 50000.0  # NPS additional deduction
SECTION_80D_SELF_LIMIT = 25000.0  # Health insurance self/family
SECTION_80D_PARENTS_SENIOR_LIMIT = 50000.0  # Parents senior citizen
STANDARD_DEDUCTION_NEW_REGIME = 75000.0  # FY 2024-25 / 2025-26
STANDARD_DEDUCTION_OLD_REGIME = 50000.0
CESS_RATE = 0.04  # 4% Health & Education Cess

# Section 87A Rebate Thresholds
REBATE_87A_NEW_REGIME_THRESHOLD = 700000.0  # Nil tax up to 7 Lakhs
REBATE_87A_OLD_REGIME_THRESHOLD = 500000.0  # Nil tax up to 5 Lakhs

# Configurable Supported Investment Categories
SUPPORTED_TAX_CATEGORIES: List[Dict[str, Any]] = [
    {
        "id": "PPF",
        "name": "Public Provident Fund (PPF)",
        "section": "80C",
        "lock_in_years": 15,
        "risk_level": "Guaranteed Sovereign",
        "tax_status": "EEE (Exempt-Exempt-Exempt)",
        "description": "Government-backed long-term savings with compounding tax-free interest.",
    },
    {
        "id": "ELSS",
        "name": "Equity Linked Savings Scheme (ELSS)",
        "section": "80C",
        "lock_in_years": 3,
        "risk_level": "Market Equity (High)",
        "tax_status": "EET (LTCG taxable at 12.5% above ₹1.25L)",
        "description": "Tax-saving diversified mutual funds with the shortest 3-year lock-in period.",
    },
    {
        "id": "LIC",
        "name": "Life & Term Insurance Premium",
        "section": "80C",
        "lock_in_years": 0,
        "risk_level": "Protection",
        "tax_status": "Exempt maturity proceeds u/s 10(10D)",
        "description": "Annual life and pure term insurance premiums paid for self, spouse, or children.",
    },
    {
        "id": "NSC",
        "name": "National Savings Certificate (NSC)",
        "section": "80C",
        "lock_in_years": 5,
        "risk_level": "Guaranteed Sovereign",
        "tax_status": "Interest deemed reinvested & 80C eligible until final year",
        "description": "Post-office guaranteed savings certificate offering fixed quarterly interest.",
    },
    {
        "id": "EPF",
        "name": "Employees' Provident Fund (EPF - Employee Share)",
        "section": "80C",
        "lock_in_years": 0,
        "risk_level": "Sovereign Backed",
        "tax_status": "EEE up to annual contribution cap",
        "description": "Mandatory retirement contribution deducted monthly from salary.",
    },
    {
        "id": "5Y_FD",
        "name": "Tax-Saver 5-Year Bank Fixed Deposit",
        "section": "80C",
        "lock_in_years": 5,
        "risk_level": "Bank Fixed",
        "tax_status": "Interest fully taxable per slab",
        "description": "Designated 5-year lock-in bank fixed deposits eligible for 80C deduction.",
    },
    {
        "id": "SSY",
        "name": "Sukanya Samriddhi Yojana (SSY)",
        "section": "80C",
        "lock_in_years": 21,
        "risk_level": "Guaranteed Sovereign",
        "tax_status": "EEE",
        "description": "High-interest sovereign savings scheme dedicated for girl children.",
    },
    {
        "id": "NPS",
        "name": "National Pension System (Tier 1)",
        "section": "80CCD(1B)",
        "lock_in_years": 60,
        "risk_level": "Market Linked",
        "tax_status": "Additional ₹50,000 deduction over and above 80C",
        "description": "Voluntary pension scheme allowing exclusive additional deduction under 80CCD(1B).",
    },
    {
        "id": "HEALTH_INSURANCE",
        "name": "Health Insurance (Mediclaim)",
        "section": "80D",
        "lock_in_years": 0,
        "risk_level": "Protection",
        "tax_status": "Deduction up to ₹25k (self/family) + ₹50k (senior parents)",
        "description": "Medical insurance premiums paid for self, family, and parents.",
    },
    {
        "id": "OTHER_80C",
        "name": "Other 80C (Tuition Fees / Home Loan Principal)",
        "section": "80C",
        "lock_in_years": 0,
        "risk_level": "Varies",
        "tax_status": "Deduction u/s 80C",
        "description": "Child university/school tuition fees or principal component of home loan EMIs.",
    },
]

# Statutory Tax Slabs for New Tax Regime (FY 2024-25 / 2025-26)
NEW_REGIME_SLABS = [
    {"min": 0.0, "max": 300000.0, "rate": 0.0},
    {"min": 300000.0, "max": 700000.0, "rate": 0.05},
    {"min": 700000.0, "max": 1000000.0, "rate": 0.10},
    {"min": 1000000.0, "max": 1200000.0, "rate": 0.15},
    {"min": 1200000.0, "max": 1500000.0, "rate": 0.20},
    {"min": 1500000.0, "max": float("inf"), "rate": 0.30},
]

# Statutory Tax Slabs for Old Tax Regime
OLD_REGIME_SLABS = [
    {"min": 0.0, "max": 250000.0, "rate": 0.0},
    {"min": 250000.0, "max": 500000.0, "rate": 0.05},
    {"min": 500000.0, "max": 1000000.0, "rate": 0.20},
    {"min": 1000000.0, "max": float("inf"), "rate": 0.30},
]

# Educational & Legal Disclaimer
TAX_DISCLAIMER = (
    "Disclaimer: The calculations, deductions, and regime comparisons provided by SMARTFIN are "
    "for general informational and illustrative purposes only. They do not constitute formal tax, "
    "legal, or certified financial advice. Tax rules, thresholds, and slab rates are subject to change "
    "in accordance with the Finance Act and notifications issued by the Income Tax Department of India. "
    "Users are strongly encouraged to consult a certified Chartered Accountant (CA) or tax professional "
    "before filing statutory tax returns or executing tax-saving investments."
)
