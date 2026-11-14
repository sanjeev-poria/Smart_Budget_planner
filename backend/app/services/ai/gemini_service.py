import json
import logging
import calendar
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.config import settings
from app.database.mongodb import get_database
from app.models.chat import (
    chat_session_helper,
    chat_message_helper,
    create_chat_session_document,
    create_chat_message_document,
)
from app.schemas.ai import (
    AIInsightItem,
    DISCLAIMER_TEXT,
)
from app.services.calculations.financial_engine import (
    calculate_surplus,
    calculate_savings_rate,
    calculate_emergency_fund,
    calculate_financial_health,
)

logger = logging.getLogger(__name__)

# Preferred Gemini models in fallback order
GEMINI_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-pro-latest",
]

SYSTEM_PROMPT = """You are SMARTFIN AI, an elite, encouraging, and highly disciplined personal financial assistant.
You specialize in personal finance, cashflow optimization, debt payoff strategies, emergency runway planning, and goal tracking.

CURRENCY REQUIREMENTS:
- The ONLY financial currency of this application is Indian Rupees (₹ / INR).
- ALL user monetary values (income, expenses, surplus, savings, debts, goals, investments, budgets, taxes, net worth) are in Indian Rupees (₹).
- ALWAYS format monetary figures using the Indian Rupee symbol (₹) and the Indian numbering format (e.g. ₹10,000, ₹1,25,000, ₹10,00,000, ₹1,00,00,000).
- NEVER use US Dollars ($), USD, or the word 'dollars' under any circumstance.

ARCHITECTURAL RULES:
1. The user's deterministic, verified financial facts are provided in the context below. You must ALWAYS ground your explanations in these verified numbers.
2. NEVER calculate or guess the health score, net worth, compound interest projections, emergency runway, or debt payoff schedules on your own. Refer directly to the verified metrics computed by the SMARTFIN financial engine.
3. Be empathetic, concise, and structured. Use Markdown formatting: bold highlights, bullet points, and short readable paragraphs.
4. When identifying financial risks (e.g. low emergency runway or high EMI burden), always give practical, step-by-step suggestions tailored to their actual numbers.
5. Keep your tone professional, prudent, and encouraging.
"""


def _get_gemini_client():
    """Safely initialize Google Gemini client if API key is present."""
    if not settings.GEMINI_API_KEY or len(settings.GEMINI_API_KEY.strip()) == 0:
        return None
    try:
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini Client: {e}")
        return None


def call_gemini_api(
    prompt: str,
    system_instruction: str = SYSTEM_PROMPT,
    json_mode: bool = False,
    temperature: float = 0.5,
) -> Optional[str]:
    """
    Execute Gemini API call with model fallback chain.
    Returns response string or None if all models fail.
    """
    client = _get_gemini_client()
    if not client:
        logger.warning("Gemini API key is not configured or client creation failed.")
        return None

    try:
        from google.genai import types

        config_kwargs = {
            "system_instruction": system_instruction,
            "temperature": temperature,
        }
        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"

        config = types.GenerateContentConfig(**config_kwargs)

        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as model_err:
                logger.warning(f"Gemini call to {model_name} failed: {model_err}. Trying fallback...")
                continue
    except Exception as err:
        logger.error(f"Error in call_gemini_api: {err}")

    return None


def get_user_financial_context(user_id: ObjectId) -> Dict[str, Any]:
    """
    Retrieve deterministic, verified metrics for user from MongoDB
    without recalculating or guessing figures.
    """
    db = get_database()
    user = db.users.find_one({"_id": user_id}) or {}

    profile = user.get("financial_profile") or {}
    income = float(profile.get("monthly_income", 0.0))
    expenses = float(profile.get("monthly_expenses", 0.0))
    savings = float(profile.get("current_savings", 0.0))
    investments = float(profile.get("monthly_investments", 0.0))
    emi = float(profile.get("monthly_emi", 0.0))
    risk_tolerance = profile.get("risk_tolerance", "Moderate")

    # Deterministic metrics from financial engine
    surplus = calculate_surplus(income, expenses)
    savings_rate = calculate_savings_rate(income, expenses)
    emergency_fund = calculate_emergency_fund(savings, expenses)

    # 5-Pillar health score
    health_score = calculate_financial_health(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        monthly_emi=emi,
        monthly_investment=investments,
    )

    # Active debts
    debts_cursor = db.debts.find({"user_id": user_id})
    debts = list(debts_cursor)
    total_debt_remaining = sum(float(d.get("remaining_balance", 0.0)) for d in debts)
    total_debt_min_payment = sum(float(d.get("minimum_payment", 0.0)) for d in debts)
    highest_interest = max([float(d.get("interest_rate", 0.0)) for d in debts], default=0.0)

    # Active goals
    goals_cursor = db.goals.find({"user_id": user_id})
    goals = list(goals_cursor)
    total_goals_target = sum(float(g.get("target_amount", 0.0)) for g in goals)
    total_goals_saved = sum(float(g.get("current_saved", 0.0)) for g in goals)

    # Recent month spending / budgets
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year
    _, last_day = calendar.monthrange(current_year, current_month)
    start_date = f"{current_year:04d}-{current_month:02d}-01"
    end_date = f"{current_year:04d}-{current_month:02d}-{last_day:02d}"

    tx_pipeline = [
        {"$match": {"user_id": user_id, "type": "expense", "date": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ]
    spending_by_category = {item["_id"]: item["total"] for item in db.transactions.aggregate(tx_pipeline)}

    budgets_cursor = db.budgets.find({"user_id": user_id, "month": current_month, "year": current_year})
    budgets = list(budgets_cursor)
    total_budgeted = sum(float(b.get("monthly_limit", 0.0)) for b in budgets)

    return {
        "user_name": user.get("name", "User"),
        "currency": profile.get("currency", "INR"),
        "monthly_income": income,
        "monthly_expenses": expenses,
        "monthly_surplus": surplus,
        "savings_rate_percent": savings_rate,
        "health_score": health_score.health_score,
        "risk_level": health_score.risk_level,
        "pillar_scores": {
            p.name.lower().replace(" ", "_"): p.model_dump()
            for p in health_score.pillars
        },
        "emergency_fund": {
            "current_savings": emergency_fund.current_savings,
            "target_emergency_fund": emergency_fund.target_amount,
            "months_covered": emergency_fund.months_covered,
            "amount_required": emergency_fund.amount_still_required,
            "percentage_completed": emergency_fund.percentage_completed,
            "status": emergency_fund.status,
            "is_fully_funded": emergency_fund.amount_still_required <= 0,
        },
        "debts": {
            "count": len(debts),
            "total_remaining": total_debt_remaining,
            "total_minimum_payment": total_debt_min_payment,
            "highest_interest_rate": highest_interest,
            "names": [d.get("debt_name") for d in debts[:5]],
        },
        "goals": {
            "count": len(goals),
            "total_target": total_goals_target,
            "total_saved": total_goals_saved,
            "names": [g.get("goal_name") for g in goals[:5]],
        },
        "spending": {
            "month": f"{calendar.month_name[current_month]} {current_year}",
            "total_spent_this_month": sum(spending_by_category.values()),
            "top_categories": [
                {"category": cat, "amount": amt}
                for cat, amt in list(spending_by_category.items())[:5]
            ],
            "total_budgeted": total_budgeted,
        },
        "risk_tolerance": risk_tolerance,
    }


def format_context_prompt(context: Dict[str, Any]) -> str:
    """Format user financial context into a factual block for LLM prompts."""
    return f"""### VERIFIED USER FINANCIAL PROFILE:
- Name: {context.get('user_name')}
- Monthly Income: ₹{context.get('monthly_income', 0):,.2f}
- Monthly Expenses: ₹{context.get('monthly_expenses', 0):,.2f}
- Monthly Net Cashflow Surplus: ₹{context.get('monthly_surplus', 0):,.2f}
- Savings Rate: {context.get('savings_rate_percent', 0):.1f}%
- Financial Health Score: {context.get('health_score', 0)}/100 (Risk Tier: {context.get('risk_level')})
- Emergency Fund: ₹{context.get('emergency_fund', {}).get('current_savings', 0):,.2f} (Runway: {context.get('emergency_fund', {}).get('months_covered', 0):.1f} months, 6M Target: ₹{context.get('emergency_fund', {}).get('target_emergency_fund', 0):,.2f})
- Active Debts: {context.get('debts', {}).get('count', 0)} debts totaling ₹{context.get('debts', {}).get('total_remaining', 0):,.2f} (Highest Interest: {context.get('debts', {}).get('highest_interest_rate', 0)}%)
- Active Goals: {context.get('goals', {}).get('count', 0)} goals (Target: ₹{context.get('goals', {}).get('total_target', 0):,.2f}, Saved: ₹{context.get('goals', {}).get('total_saved', 0):,.2f})
- Recent Spending: Top categories: {context.get('spending', {}).get('top_categories', [])}
- Risk Tolerance: {context.get('risk_tolerance')}
"""


# ---------------------------------------------------------------------------
# Fallback Heuristics for Zero Downtime
# ---------------------------------------------------------------------------

def _heuristic_chat_reply(message: str, context: Dict[str, Any]) -> str:
    """Generate intelligent deterministic responses when Gemini API is unavailable."""
    msg = message.lower().strip()
    income = context.get("monthly_income", 0.0)
    expenses = context.get("monthly_expenses", 0.0)
    surplus = context.get("monthly_surplus", 0.0)
    savings_rate = context.get("savings_rate_percent", 0.0)
    health_score = context.get("health_score", 0.0)
    risk_level = context.get("risk_level", "Moderate")
    emergency = context.get("emergency_fund", {})
    runway = emergency.get("months_covered", 0.0)
    debts = context.get("debts", {})

    if "health score" in msg or "why is my health score" in msg or "score low" in msg:
        return (
            f"### Financial Health Score Analysis ({health_score}/100 — {risk_level})\n\n"
            f"Your SMARTFIN Health Score is evaluated across 5 core pillars:\n"
            f"- **Savings Rate**: Currently **{savings_rate:.1f}%** (Target: 20%+).\n"
            f"- **Emergency Runway**: You currently have **{runway:.1f} months** of runway (Recommended: 6 months).\n"
            f"- **Debt & EMI**: {debts.get('count', 0)} active debts totaling ₹{debts.get('total_remaining', 0):,.2f}.\n\n"
            f"**Action Steps to Boost Your Score**:\n"
            f"1. Prioritize building your emergency fund to at least 3–6 months (₹{emergency.get('target_emergency_fund', 0):,.2f}).\n"
            f"2. Maintain your savings rate above 20% by controlling discretionary lifestyle expenses.\n"
            f"3. Pay off high-interest debts using the Avalanche strategy to free up monthly cashflow."
        )

    if "savings" in msg or "improve my savings" in msg or "save more" in msg:
        target_savings = round(income * 0.20, 2)
        return (
            f"### Cashflow & Savings Improvement Plan\n\n"
            f"- **Monthly Income**: ₹{income:,.2f}\n"
            f"- **Monthly Expenses**: ₹{expenses:,.2f}\n"
            f"- **Current Surplus**: ₹{surplus:,.2f} (**{savings_rate:.1f}%** savings rate)\n\n"
            f"**Recommendations**:\n"
            f"1. **Follow the 50/30/20 Rule**: Aim for ₹{target_savings:,.2f}/month (20% of income) in automated savings and investments.\n"
            f"2. **Trim Flexible Outflows**: Review subscription and dining expenses in the Budgets section.\n"
            f"3. **Automate Transfers**: Set up an automatic sweep on salary day directly into a high-yield emergency account or SIP."
        )

    if "emergency" in msg or "runway" in msg:
        return (
            f"### Emergency Fund Runway Breakdown\n\n"
            f"- **Current Liquid Savings**: ₹{emergency.get('current_savings', 0):,.2f}\n"
            f"- **Current Runway**: **{runway:.1f} months** of living expenses.\n"
            f"- **Recommended 6-Month Target**: ₹{emergency.get('target_emergency_fund', 0):,.2f}\n"
            f"- **Shortfall to Complete**: ₹{emergency.get('amount_required', 0):,.2f}\n\n"
            f"**Recommendation**: An emergency reserve protects you from liquidating long-term investments or accumulating credit debt during unexpected events. Aim to contribute a portion of your monthly surplus (₹{surplus:,.2f}) until your runway reaches 6 full months."
        )

    if "debt" in msg or "liabilities" in msg or "loans" in msg:
        return (
            f"### Debt Situation Overview\n\n"
            f"- **Active Debts**: {debts.get('count', 0)}\n"
            f"- **Total Outstanding**: ₹{debts.get('total_remaining', 0):,.2f}\n"
            f"- **Monthly Minimum Payments**: ₹{debts.get('total_minimum_payment', 0):,.2f}\n"
            f"- **Highest Interest Rate**: {debts.get('highest_interest_rate', 0)}%\n\n"
            f"**Strategic Advice**:\n"
            f"1. **Avalanche Method**: Direct any extra cashflow toward your highest-interest debt first to minimize total interest paid.\n"
            f"2. **Snowball Method**: If you need psychological momentum, pay off the smallest balance first to eliminate a monthly payment fast.\n"
            f"Visit the **Debt Management** page to simulate the month-by-month payoff schedule."
        )

    if "spending" in msg or "where am i spending" in msg or "budget" in msg:
        spending = context.get("spending", {})
        top_cats = spending.get("top_categories", [])
        cat_lines = "\n".join([f"- **{c['category']}**: ₹{c['amount']:,.2f}" for c in top_cats]) if top_cats else "- No recent transactions recorded."
        return (
            f"### Spending Insights ({spending.get('month', 'Current Month')})\n\n"
            f"- **Total Spent**: ₹{spending.get('total_spent_this_month', 0):,.2f}\n"
            f"- **Total Budgeted**: ₹{spending.get('total_budgeted', 0):,.2f}\n\n"
            f"**Top Expense Categories**:\n{cat_lines}\n\n"
            f"**Tip**: Setting monthly limits in the **Budgets** module will notify you when spending reaches 80% and 100% of your targets."
        )

    if "goal" in msg or "how much should i save" in msg:
        goals = context.get("goals", {})
        return (
            f"### Financial Goals Status\n\n"
            f"- **Active Goals**: {goals.get('count', 0)}\n"
            f"- **Total Target**: ₹{goals.get('total_target', 0):,.2f}\n"
            f"- **Total Accumulated**: ₹{goals.get('total_saved', 0):,.2f}\n"
            f"- **Current Monthly Surplus**: ₹{surplus:,.2f}\n\n"
            f"**Advice**: Check the **Goals** dashboard to ensure your required monthly contributions fit comfortably inside your surplus without reducing your emergency runway."
        )

    # General Assistant Fallback
    return (
        f"### SMARTFIN Financial Summary for {context.get('user_name', 'you')}\n\n"
        f"- **Health Score**: **{health_score}/100** ({risk_level})\n"
        f"- **Monthly Surplus**: ₹{surplus:,.2f} ({savings_rate:.1f}% savings rate)\n"
        f"- **Emergency Runway**: {runway:.1f} months\n"
        f"- **Active Debts**: {debts.get('count', 0)} (₹{debts.get('total_remaining', 0):,.2f})\n\n"
        f"How can I help you optimize your finances today? You can ask me about:\n"
        f"- Explaining your health score and improvement pillars\n"
        f"- Optimizing your emergency fund runway\n"
        f"- Analyzing your recent spending categories\n"
        f"- Structuring an Avalanche vs. Snowball debt payoff plan\n"
        f"- Testing scenarios in the What-If Simulator"
    )


# ---------------------------------------------------------------------------
# Core Service Functions
# ---------------------------------------------------------------------------

def chat_with_gemini(
    user_id: ObjectId,
    user_message: str,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Handle user chat message:
    1. Retrieve or create session.
    2. Fetch recent conversation history.
    3. Retrieve grounded financial facts.
    4. Call Gemini (or intelligent fallback).
    5. Save user & assistant messages in MongoDB.
    6. Return response with session details and disclaimer.
    """
    db = get_database()

    # 1. Resolve Session
    session_oid = None
    if session_id:
        try:
            session_oid = ObjectId(session_id)
            existing = db.chat_sessions.find_one({"_id": session_oid, "user_id": user_id})
            if not existing:
                session_oid = None
        except Exception:
            session_oid = None

    if not session_oid:
        # Create descriptive title from first few words of message
        words = user_message.strip().split()
        title = " ".join(words[:5]) if words else "Financial Discussion"
        if len(title) > 40:
            title = title[:37] + "..."
        doc = create_chat_session_document(user_id=user_id, title=title)
        res = db.chat_sessions.insert_one(doc)
        session_oid = res.inserted_id

    # 2. Retrieve recent message history (last 6 messages)
    history_cursor = db.chat_messages.find({"session_id": session_oid}).sort("created_at", -1).limit(6)
    history = list(history_cursor)[::-1]  # chronological order

    # 3. Retrieve verified user financial facts
    context = get_user_financial_context(user_id)
    grounded_block = format_context_prompt(context)

    # 4. Save user's incoming message
    user_msg_doc = create_chat_message_document(
        session_id=session_oid,
        user_id=user_id,
        role="user",
        content=user_message.strip(),
        context_snapshot={"health_score": context.get("health_score"), "surplus": context.get("monthly_surplus")},
    )
    db.chat_messages.insert_one(user_msg_doc)

    # Build prompt with history
    conversation_prompt = f"{grounded_block}\n\n### CONVERSATION HISTORY:\n"
    for h in history:
        role_label = "User" if h.get("role") == "user" else "SMARTFIN AI"
        conversation_prompt += f"{role_label}: {h.get('content')}\n"

    conversation_prompt += f"\nUser: {user_message.strip()}\n\nSMARTFIN AI Response:"

    # Call Gemini API
    ai_text = call_gemini_api(prompt=conversation_prompt, system_instruction=SYSTEM_PROMPT, temperature=0.6)

    # If API call returned None, use heuristic response
    if not ai_text:
        ai_text = _heuristic_chat_reply(user_message, context)

    # 5. Save model response
    model_msg_doc = create_chat_message_document(
        session_id=session_oid,
        user_id=user_id,
        role="model",
        content=ai_text,
    )
    model_res = db.chat_messages.insert_one(model_msg_doc)
    model_msg_doc["_id"] = model_res.inserted_id

    # Update session
    db.chat_sessions.update_one(
        {"_id": session_oid},
        {
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "last_message": user_message[:60],
            }
        },
    )

    return {
        "session_id": str(session_oid),
        "message": chat_message_helper(model_msg_doc),
        "disclaimer": DISCLAIMER_TEXT,
    }


def get_user_chat_sessions(user_id: ObjectId) -> List[Dict[str, Any]]:
    """List all chat sessions for user sorted by most recent activity."""
    db = get_database()
    sessions = list(db.chat_sessions.find({"user_id": user_id}).sort("updated_at", -1))
    results = []
    for s in sessions:
        s_id = s["_id"]
        count = db.chat_messages.count_documents({"session_id": s_id})
        last_msg = s.get("last_message", "")
        results.append(chat_session_helper(s, message_count=count, last_message=last_msg))
    return results


def get_session_messages(user_id: ObjectId, session_id: str) -> List[Dict[str, Any]]:
    """Retrieve full message history for a given session."""
    db = get_database()
    try:
        s_oid = ObjectId(session_id)
    except Exception:
        return []

    # Verify session belongs to user
    session = db.chat_sessions.find_one({"_id": s_oid, "user_id": user_id})
    if not session:
        return []

    messages = list(db.chat_messages.find({"session_id": s_oid}).sort("created_at", 1))
    return [chat_message_helper(m) for m in messages]


def delete_chat_session(user_id: ObjectId, session_id: str) -> bool:
    """Delete a chat session and all its associated messages."""
    db = get_database()
    try:
        s_oid = ObjectId(session_id)
    except Exception:
        return False

    res = db.chat_sessions.delete_one({"_id": s_oid, "user_id": user_id})
    if res.deleted_count > 0:
        db.chat_messages.delete_many({"session_id": s_oid})
        return True
    return False


def generate_financial_insights(user_id: ObjectId) -> List[AIInsightItem]:
    """
    Generate 3-5 personalized, prioritized insights on spending, emergency runway,
    goals, and debt using Gemini with deterministic fallback.
    """
    context = get_user_financial_context(user_id)
    grounded_block = format_context_prompt(context)

    prompt = f"""{grounded_block}

TASK:
Analyze the verified financial facts above. Generate exactly 3 to 4 personalized, actionable financial insights.
Return a valid JSON array of objects with the exact keys:
- "category": One of "Savings", "Emergency Fund", "Debt", "Budget", "Investment", "General"
- "title": Short impactful title (e.g. "Emergency Runway Below Target")
- "insight": 1-2 sentences explaining what the data shows
- "action_item": 1 concrete step to take
- "priority": "high", "medium", or "low"
"""

    gemini_out = call_gemini_api(prompt=prompt, json_mode=True, temperature=0.3)
    if gemini_out:
        try:
            parsed = json.loads(gemini_out)
            if isinstance(parsed, dict) and "insights" in parsed:
                parsed = parsed["insights"]
            if isinstance(parsed, list):
                items = []
                for p in parsed[:5]:
                    items.append(
                        AIInsightItem(
                            category=p.get("category", "General"),
                            title=p.get("title", "Financial Insight"),
                            insight=p.get("insight", ""),
                            action_item=p.get("action_item", ""),
                            priority=p.get("priority", "medium").lower(),
                        )
                    )
                if items:
                    return items
        except Exception as err:
            logger.warning(f"Failed to parse Gemini insights JSON: {err}")

    # Deterministic Heuristic Fallback Insights
    items: List[AIInsightItem] = []
    runway = context.get("emergency_fund", {}).get("months_covered", 0.0)
    surplus = context.get("monthly_surplus", 0.0)
    savings_rate = context.get("savings_rate_percent", 0.0)
    debts = context.get("debts", {})
    goals = context.get("goals", {})

    # 1. Emergency Fund Insight
    if runway < 3.0:
        items.append(
            AIInsightItem(
                category="Emergency Fund",
                title="Critical Emergency Buffer Needed",
                insight=f"You currently have {runway:.1f} months of expenses saved. Financial safety standards recommend at least 3 to 6 months.",
                action_item=f"Allocate ₹{min(surplus, 10000.0):,.0f}/month from your cashflow surplus into a high-yield liquid fund until you reach ₹{context.get('emergency_fund', {}).get('target_emergency_fund', 0):,.0f}.",
                priority="high",
            )
        )
    elif runway < 6.0:
        items.append(
            AIInsightItem(
                category="Emergency Fund",
                title="Good Emergency Foundation",
                insight=f"Your liquid reserve covers {runway:.1f} months of essential burn, on track toward the 6-month goal.",
                action_item="Continue gradual allocations to close the remaining gap without pausing goal investments.",
                priority="medium",
            )
        )
    else:
        items.append(
            AIInsightItem(
                category="Emergency Fund",
                title="Emergency Fund Fully Optimized",
                insight=f"You have {runway:.1f} months of living expenses safely preserved.",
                action_item="Direct excess monthly surplus toward higher-yield long-term investments and wealth creation.",
                priority="low",
            )
        )

    # 2. Savings Rate & Cashflow Insight
    if savings_rate < 15.0:
        items.append(
            AIInsightItem(
                category="Savings",
                title="Low Monthly Savings Allocation",
                insight=f"Your current savings rate is {savings_rate:.1f}% of income, leaving little room for compounding.",
                action_item="Identify 1-2 non-essential expense categories in the Budgets section to push savings past 20%.",
                priority="high",
            )
        )
    else:
        items.append(
            AIInsightItem(
                category="Savings",
                title="Strong Cashflow Discipline",
                insight=f"You are saving {savings_rate:.1f}% of your monthly income (₹{surplus:,.2f}/month).",
                action_item="Maintain this rhythm and explore automated index SIPs to beat inflation.",
                priority="medium",
            )
        )

    # 3. Debt Insight
    if debts.get("count", 0) > 0:
        items.append(
            AIInsightItem(
                category="Debt",
                title="High-Interest Debt Optimization",
                insight=f"You have ₹{debts.get('total_remaining', 0):,.2f} in active debt obligations with interest up to {debts.get('highest_interest_rate', 0)}%.",
                action_item="Deploy the Avalanche strategy on the Debts page to prioritize highest-interest loans first.",
                priority="high" if debts.get("highest_interest_rate", 0) > 12 else "medium",
            )
        )

    # 4. Goals Insight
    if goals.get("count", 0) > 0:
        items.append(
            AIInsightItem(
                category="General",
                title="Active Financial Goals Tracking",
                insight=f"You have {goals.get('count')} active life goals totaling ₹{goals.get('total_target', 0):,.2f}.",
                action_item="Review target dates in the Goals module to ensure required monthly deposits match your surplus.",
                priority="medium",
            )
        )

    return items


def explain_health_score(user_id: ObjectId, score_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-language explanation of 5-pillar health score components using Gemini.
    """
    score = float(score_data.get("score", 0.0))
    risk_level = str(score_data.get("risk_level", "Moderate"))
    components = score_data.get("components", {})

    prompt = f"""### FINANCIAL HEALTH SCORE EVALUATION:
- Overall Score: {score:.1f}/100
- Risk Level: {risk_level}
- Pillar Breakdown: {json.dumps(components)}

TASK:
Explain this health score in clear, encouraging, and human language.
Provide:
1. "explanation": A 2-3 paragraph breakdown explaining which pillars are strong and which are pulling the score down.
2. "recommendations": A list of 3 specific, high-impact action steps the user can take to boost their score.

Return a valid JSON object with keys "explanation" (string) and "recommendations" (list of strings).
"""

    gemini_out = call_gemini_api(prompt=prompt, json_mode=True, temperature=0.4)
    if gemini_out:
        try:
            parsed = json.loads(gemini_out)
            return {
                "score": score,
                "risk_level": risk_level,
                "explanation": parsed.get("explanation", ""),
                "recommendations": parsed.get("recommendations", []),
                "disclaimer": DISCLAIMER_TEXT,
            }
        except Exception as err:
            logger.warning(f"Failed to parse health score explanation JSON: {err}")

    # Heuristic Fallback
    explanation = (
        f"Your financial health score is currently evaluated at **{score:.1f}/100**, placing you in the **{risk_level}** risk tier. "
        f"SMARTFIN calculates this score deterministically using 5 key pillars: Savings Rate (25%), Emergency Fund Runway (20%), "
        f"EMI/Debt Burden (20%), Investment Consistency (20%), and Expense Control (15%).\n\n"
        f"To elevate your score toward 85+ (Excellent), focus on reinforcing weak pillars such as emergency coverage and debt reduction, "
        f"while maintaining consistent monthly contributions."
    )
    recs = [
        "Build a liquid emergency buffer covering 3 to 6 months of living expenses.",
        "Maintain your monthly savings rate above 20% by automating transfers on salary day.",
        "Reduce high-interest debt using the Avalanche method to decrease your DTI ratio.",
    ]
    return {
        "score": score,
        "risk_level": risk_level,
        "explanation": explanation,
        "recommendations": recs,
        "disclaimer": DISCLAIMER_TEXT,
    }


def explain_whatif_scenario(user_id: ObjectId, scenario_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Explain differences between baseline and what-if simulation states using Gemini.
    """
    baseline = scenario_data.get("baseline", {})
    what_if = scenario_data.get("what_if", {})
    deltas = scenario_data.get("deltas", {})

    prompt = f"""### WHAT-IF FINANCIAL SIMULATION DATA:
Baseline State:
- Monthly Income: ₹{baseline.get('income', 0):,.2f}
- Monthly Expenses: ₹{baseline.get('expenses', 0):,.2f}
- Monthly Surplus: ₹{baseline.get('surplus', 0):,.2f}
- Savings Rate: {baseline.get('savings_rate', 0)}%
- Health Score: {baseline.get('health_score', 0)}/100
- Emergency Runway: {baseline.get('emergency_runway', 0)} months

Hypothetical What-If State:
- Monthly Income: ₹{what_if.get('income', 0):,.2f}
- Monthly Expenses: ₹{what_if.get('expenses', 0):,.2f}
- Monthly Surplus: ₹{what_if.get('surplus', 0):,.2f}
- Savings Rate: {what_if.get('savings_rate', 0)}%
- Health Score: {what_if.get('health_score', 0)}/100
- Emergency Runway: {what_if.get('emergency_runway', 0)} months

Deltas / Differences: {json.dumps(deltas)}

TASK:
Explain what this hypothetical adjustment accomplishes for the user.
Return a valid JSON object with keys:
- "summary": A concise 2-sentence summary of the scenario's primary effect.
- "strengths": A list of 2-3 positive benefits (e.g. improved runway, faster compounding).
- "tradeoffs": A list of 1-2 potential risks or trade-offs (e.g. tighter cashflow, increased risk).
- "verdict": A clear 1-sentence bottom-line recommendation.
"""

    gemini_out = call_gemini_api(prompt=prompt, json_mode=True, temperature=0.4)
    if gemini_out:
        try:
            parsed = json.loads(gemini_out)
            return {
                "summary": parsed.get("summary", ""),
                "strengths": parsed.get("strengths", []),
                "tradeoffs": parsed.get("tradeoffs", []),
                "verdict": parsed.get("verdict", ""),
                "disclaimer": DISCLAIMER_TEXT,
            }
        except Exception as err:
            logger.warning(f"Failed to parse what-if explanation JSON: {err}")

    # Heuristic Fallback
    delta_surplus = float(what_if.get("surplus", 0)) - float(baseline.get("surplus", 0))
    delta_score = float(what_if.get("health_score", 0)) - float(baseline.get("health_score", 0))
    summary = (
        f"This simulation shifts your monthly surplus by ₹{delta_surplus:+,.2f} and changes your financial health score by {delta_score:+.1f} points. "
        f"Your emergency runway moves to {what_if.get('emergency_runway', 0):.1f} months."
    )
    strengths = [
        f"Monthly cashflow changes by ₹{delta_surplus:+,.2f}.",
        f"Savings rate adjusts from {baseline.get('savings_rate', 0)}% to {what_if.get('savings_rate', 0)}%.",
    ]
    tradeoffs = [
        "Ensure lifestyle adjustments or new liabilities remain sustainable over the long term.",
    ]
    verdict = (
        "Overall positive adjustment for long-term compounding."
        if delta_surplus >= 0
        else "Proceed with caution as this reduces monthly surplus buffer."
    )
    return {
        "summary": summary,
        "strengths": strengths,
        "tradeoffs": tradeoffs,
        "verdict": verdict,
        "disclaimer": DISCLAIMER_TEXT,
    }


def generate_monthly_summary(user_id: ObjectId) -> Dict[str, Any]:
    """
    Generate a concise natural-language monthly financial report summary.
    """
    context = get_user_financial_context(user_id)
    spending = context.get("spending", {})
    month_name = spending.get("month", "This Month")

    prompt = f"""{format_context_prompt(context)}

TASK:
Generate an executive monthly financial summary for the month of {month_name}.
Return a valid JSON object with keys:
- "month": "{month_name}"
- "summary": A 2-paragraph executive overview of the user's financial posture this month.
- "highlights": List of 3 key positive achievements or milestones.
- "areas_for_improvement": List of 2 specific areas needing discipline or attention next month.
"""

    gemini_out = call_gemini_api(prompt=prompt, json_mode=True, temperature=0.3)
    if gemini_out:
        try:
            parsed = json.loads(gemini_out)
            return {
                "month": parsed.get("month", month_name),
                "summary": parsed.get("summary", ""),
                "highlights": parsed.get("highlights", []),
                "areas_for_improvement": parsed.get("areas_for_improvement", []),
                "disclaimer": DISCLAIMER_TEXT,
            }
        except Exception as err:
            logger.warning(f"Failed to parse monthly summary JSON: {err}")

    # Heuristic Fallback
    summary = (
        f"During {month_name}, your financial profile demonstrated a stable posture with ₹{context.get('monthly_income', 0):,.2f} in total income "
        f"and ₹{context.get('monthly_expenses', 0):,.2f} in routine living expenses, generating a healthy surplus of ₹{context.get('monthly_surplus', 0):,.2f}.\n\n"
        f"Your Financial Health Score stands at {context.get('health_score', 0)}/100 ({context.get('risk_level')}), supported by {context.get('emergency_fund', {}).get('months_covered', 0):.1f} months of emergency runway."
    )
    highlights = [
        f"Net monthly surplus maintained at ₹{context.get('monthly_surplus', 0):,.2f}.",
        f"Savings rate held steady at {context.get('savings_rate_percent', 0):.1f}%.",
        f"Active tracking of {context.get('goals', {}).get('count', 0)} financial goals.",
    ]
    areas = [
        "Continue expanding emergency reserve toward the 6-month safety benchmark.",
        "Review top spending categories to curb unbudgeted discretionary outflows.",
    ]
    return {
        "month": month_name,
        "summary": summary,
        "highlights": highlights,
        "areas_for_improvement": areas,
        "disclaimer": DISCLAIMER_TEXT,
    }
