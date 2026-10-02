"""Simple JSON state file — tracks last run, errors, pending drafts."""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _path() -> Path:
    from config import STATE_FILE
    return Path(STATE_FILE)


def load() -> dict[str, Any]:
    p = _path()
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except Exception as e:
        logger.warning(f"Could not load state: {e}")
        return {}


def save(data: dict[str, Any]) -> None:
    p = _path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2, default=str))


def update(**kwargs: Any) -> None:
    data = load()
    data.update(kwargs)
    save(data)


def mark_run(status: str, error: str = "") -> None:
    update(
        last_run=datetime.now(timezone.utc).isoformat(),
        last_status=status,
        last_error=error,
    )
