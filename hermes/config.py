"""Centralised configuration — loaded from /home/ubuntu/hermes/.env."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env next to this file (server: /home/ubuntu/hermes/.env)
load_dotenv(Path(__file__).parent / ".env")

# ── Required ─────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN: str = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID: int = int(os.environ["TELEGRAM_CHAT_ID"])
BLOG_API_KEY: str = os.environ["BLOG_API_KEY"]
OPENROUTER_API_KEY: str = os.environ["OPENROUTER_API_KEY"]
TAVILY_API_KEY: str = os.environ["TAVILY_API_KEY"]

# OpenAI direct API (optional). If set, it's the PRIMARY writer provider;
# the OpenRouter free chain becomes the fallback.
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# ── Optional with sensible defaults ──────────────────────────────────
BLOG_API_BASE: str = os.getenv("BLOG_API_BASE", "http://localhost:3000")
BLOG_PUBLIC_BASE: str = os.getenv("BLOG_PUBLIC_BASE", "https://blog.nandankumar.com")
WRITER_MODEL: str = os.getenv("WRITER_MODEL", "moonshotai/kimi-k2.6:free")

# Fallback chain — tried in order if the primary is rate-limited (429).
# Override via FALLBACK_MODELS env (comma-separated) if needed.
FALLBACK_MODELS: list[str] = [
    m.strip() for m in os.getenv(
        "FALLBACK_MODELS",
        "openai/gpt-oss-120b:free,openai/gpt-oss-20b:free,meta-llama/llama-3.3-70b-instruct:free",
    ).split(",") if m.strip()
]

# How many times to retry each model on a 429 before moving on
MODEL_RETRIES: int = int(os.getenv("MODEL_RETRIES", "3"))

MAX_TOPICS: int = int(os.getenv("MAX_TOPICS", "8"))
MAX_SOURCES_PER_TOPIC: int = int(os.getenv("MAX_SOURCES_PER_TOPIC", "4"))

STATE_FILE: str = str(Path(__file__).parent / "state.json")
LOG_FILE: str = str(Path(__file__).parent / "hermes.log")
