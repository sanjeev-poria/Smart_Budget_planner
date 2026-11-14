from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.schemas.ai import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionResponse,
    AIChatResponse,
    AIInsightsResponse,
    ScoreExplanationRequest,
    ScoreExplanationResponse,
    ScenarioExplanationRequest,
    ScenarioExplanationResponse,
    MonthlySummaryResponse,
    DISCLAIMER_TEXT,
)
from app.services.ai.gemini_service import (
    chat_with_gemini,
    get_user_chat_sessions,
    get_session_messages,
    delete_chat_session,
    generate_financial_insights,
    explain_health_score,
    explain_whatif_scenario,
    generate_monthly_summary,
)

router = APIRouter(prefix="/ai", tags=["AI Financial Assistant"])


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="Send message to AI Financial Assistant with grounded financial facts",
)
def chat_endpoint(
    chat_in: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    User sends a question or prompt.
    SMARTFIN grounds the request with real verified figures from the deterministic engine,
    calls Gemini with conversation history, records messages in MongoDB, and returns the response.
    """
    res = chat_with_gemini(
        user_id=current_user["_id"],
        user_message=chat_in.message,
        session_id=chat_in.session_id,
    )
    return res


@router.get(
    "/sessions",
    response_model=List[ChatSessionResponse],
    summary="List all chat sessions for the authenticated user",
)
def list_sessions_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """Returns chat session history for user sidebar."""
    return get_user_chat_sessions(user_id=current_user["_id"])


@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[ChatMessageResponse],
    summary="Get all messages in a specific chat session",
)
def get_session_messages_endpoint(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve full conversation stream for a session."""
    return get_session_messages(user_id=current_user["_id"], session_id=session_id)


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Clear/delete a chat session and its message history",
)
def delete_session_endpoint(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete conversation session from database."""
    success = delete_chat_session(user_id=current_user["_id"], session_id=session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or does not belong to user",
        )
    return {"message": "Chat session and messages successfully deleted"}


@router.get(
    "/insights",
    response_model=AIInsightsResponse,
    summary="Get 3-5 personalized, grounded financial insights",
)
def get_insights_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns prioritized strategic insights covering emergency fund,
    savings rate, budget adherence, and debt payoff.
    """
    items = generate_financial_insights(user_id=current_user["_id"])
    return AIInsightsResponse(insights=items, disclaimer=DISCLAIMER_TEXT)


@router.post(
    "/explain-score",
    response_model=ScoreExplanationResponse,
    summary="Explain 5-pillar health score components in plain language",
)
def explain_score_endpoint(
    score_in: ScoreExplanationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Receives calculated score components and returns clear explanatory breakdown
    and 3 specific action steps to improve.
    """
    return explain_health_score(
        user_id=current_user["_id"],
        score_data=score_in.model_dump(),
    )


@router.post(
    "/explain-scenario",
    response_model=ScenarioExplanationResponse,
    summary="Explain What-If simulation differences and trade-offs",
)
def explain_scenario_endpoint(
    scenario_in: ScenarioExplanationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Receives baseline and what-if simulation results and returns executive summary,
    key strengths, trade-offs, and final verdict.
    """
    return explain_whatif_scenario(
        user_id=current_user["_id"],
        scenario_data=scenario_in.model_dump(),
    )


@router.get(
    "/monthly-summary",
    response_model=MonthlySummaryResponse,
    summary="Generate executive monthly report summary",
)
def monthly_summary_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """Returns concise natural-language monthly financial summary with highlights and action areas."""
    return generate_monthly_summary(user_id=current_user["_id"])
