from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def chat_session_helper(session: Dict[str, Any], message_count: int = 0, last_message: str = "") -> Dict[str, Any]:
    """Convert MongoDB chat_session document to client-safe response dict."""
    if not session:
        return {}

    return {
        "id": str(session.get("_id")),
        "user_id": str(session.get("user_id")),
        "title": session.get("title", "New Conversation"),
        "message_count": message_count,
        "last_message": last_message,
        "created_at": session.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": session.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    }


def chat_message_helper(message: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB chat_message document to client-safe response dict."""
    if not message:
        return {}

    return {
        "id": str(message.get("_id")),
        "session_id": str(message.get("session_id")),
        "user_id": str(message.get("user_id")),
        "role": message.get("role", "user"),  # "user" | "model" | "system"
        "content": message.get("content", ""),
        "context_snapshot": message.get("context_snapshot") or {},
        "created_at": message.get("created_at") or datetime.now(timezone.utc).isoformat(),
    }


def create_chat_session_document(user_id: ObjectId, title: str = "New Conversation") -> Dict[str, Any]:
    """Construct a new chat_session document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "title": title.strip() or "New Conversation",
        "created_at": now,
        "updated_at": now,
    }


def create_chat_message_document(
    session_id: ObjectId,
    user_id: ObjectId,
    role: str,
    content: str,
    context_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Construct a new chat_message document for MongoDB insertion."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "context_snapshot": context_snapshot or {},
        "created_at": now,
    }
