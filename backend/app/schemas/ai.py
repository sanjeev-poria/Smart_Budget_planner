from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


DISCLAIMER_TEXT = (
    "These insights are for educational purposes and are not a substitute for professional financial advice."
)


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User question or prompt for AI Advisor")
    session_id: Optional[str] = Field(None, description="Existing chat session ID if continuing conversation")


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    role: str  # "user" | "model" | "system"
    content: str
    context_snapshot: Optional[Dict[str, Any]] = None
    created_at: str


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message_count: int = 0
    last_message: str = ""
    created_at: str
    updated_at: str


class AIChatResponse(BaseModel):
    session_id: str
    message: ChatMessageResponse
    disclaimer: str = DISCLAIMER_TEXT


class AIInsightItem(BaseModel):
    category: str  # "Savings" | "Emergency Fund" | "Debt" | "Budget" | "Investment" | "General"
    title: str
    insight: str
    action_item: str
    priority: str = "medium"  # "high" | "medium" | "low"


class AIInsightsResponse(BaseModel):
    insights: List[AIInsightItem]
    disclaimer: str = DISCLAIMER_TEXT


class ScoreExplanationRequest(BaseModel):
    score: float = Field(..., ge=0, le=100)
    components: Dict[str, Any] = Field(default_factory=dict)
    risk_level: Optional[str] = None


class ScoreExplanationResponse(BaseModel):
    score: float
    risk_level: str
    explanation: str
    recommendations: List[str]
    disclaimer: str = DISCLAIMER_TEXT


class ScenarioExplanationRequest(BaseModel):
    baseline: Dict[str, Any]
    what_if: Dict[str, Any]
    deltas: Optional[Dict[str, Any]] = None


class ScenarioExplanationResponse(BaseModel):
    summary: str
    strengths: List[str]
    tradeoffs: List[str]
    verdict: str
    disclaimer: str = DISCLAIMER_TEXT


class MonthlySummaryResponse(BaseModel):
    month: str
    summary: str
    highlights: List[str]
    areas_for_improvement: List[str]
    disclaimer: str = DISCLAIMER_TEXT
