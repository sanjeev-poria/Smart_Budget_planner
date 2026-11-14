"""
Gemini AI Financial Advisory Service.

Architecture Rule:
Gemini AI does NOT calculate raw figures. It receives verified data computed by the
deterministic financial engine, and generates contextual explanations, personalized insights,
and natural language guidance.
"""

from app.core.config import settings
from app.services.ai.gemini_service import (
    chat_with_gemini,
    get_user_chat_sessions,
    get_session_messages,
    delete_chat_session,
    generate_financial_insights,
    explain_health_score,
    explain_whatif_scenario,
    generate_monthly_summary,
    get_user_financial_context,
)


def check_ai_status() -> str:
    """Check if Gemini API Key is configured in environment."""
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 0:
        return "configured"
    return "key_not_configured"


__all__ = [
    "check_ai_status",
    "chat_with_gemini",
    "get_user_chat_sessions",
    "get_session_messages",
    "delete_chat_session",
    "generate_financial_insights",
    "explain_health_score",
    "explain_whatif_scenario",
    "generate_monthly_summary",
    "get_user_financial_context",
]
