from datetime import datetime, timezone


def get_utc_now_iso() -> str:
    """Return current UTC time in ISO-8601 string format."""
    return datetime.now(timezone.utc).isoformat()
