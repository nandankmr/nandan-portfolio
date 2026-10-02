"""
Interactive pipeline — the orchestration shared by the bot and the cron.

Flow:
  1. send_topic_list(bot)        — discover topics, send a numbered list with
                                    one button per topic. Sets mode=choosing.
  2. research_and_publish(bot, i)— research the chosen topic, write + publish a
                                    draft, notify with Approve/Discard. Sets
                                    mode=reviewing + active_draft_id.
  3. revise_active_draft(bot, n) — rewrite the active draft using the user's
                                    notes, update it, notify again. Stays in
                                    mode=reviewing.

State (state.json) keys used:
  mode            : "idle" | "choosing" | "reviewing"
  topics          : list of topic dicts from the last discovery
  active_draft_id : id of the draft currently under review
"""

import asyncio
import logging
from dataclasses import asdict

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode

import config
import state
from discovery import Topic, discover_topics
from publisher import get_draft, publish_draft, update_draft
from research import research_topic
from writer import revise_post, write_post

logger = logging.getLogger(__name__)


def _esc(text: str) -> str:
    return text.replace("*", "\\*").replace("_", "\\_").replace("[", "\\[")


def _draft_keyboard(post_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Approve", callback_data=f"approve:{post_id}"),
        InlineKeyboardButton("❌ Discard", callback_data=f"discard:{post_id}"),
    ]])


# ── Step 1: discover + present topics ─────────────────────────────────

async def send_topic_list(bot: Bot) -> None:
    """Discover topics and present them as a numbered, tappable list."""
    await bot.send_message(
        chat_id=config.TELEGRAM_CHAT_ID,
        text="🔍 Scanning for today's topics…",
    )

    topics = await discover_topics()
    if not topics:
        state.update(mode="idle", topics=[])
        await bot.send_message(
            chat_id=config.TELEGRAM_CHAT_ID,
            text="No topics found right now. Try /run again in a bit.",
        )
        return

    state.update(mode="choosing", topics=[asdict(t) for t in topics], active_draft_id=None)

    lines = ["*Pick a topic to research:*", ""]
    buttons = []
    for i, t in enumerate(topics):
        lines.append(f"*{i + 1}.* {_esc(t.title)}  _({t.source})_")
        buttons.append([InlineKeyboardButton(f"{i + 1}", callback_data=f"topic:{i}")])

    lines.append("")
    lines.append("_Tap a number below to draft that one._")

    await bot.send_message(
        chat_id=config.TELEGRAM_CHAT_ID,
        text="\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons),
        disable_web_page_preview=True,
    )


# ── Step 2: research the chosen topic + publish a draft ───────────────

async def research_and_publish(bot: Bot, topic_index: int) -> None:
    """Research the topic at `topic_index`, write + publish a draft, notify."""
    s = state.load()
    topics = s.get("topics", [])
    if topic_index < 0 or topic_index >= len(topics):
        await bot.send_message(
            chat_id=config.TELEGRAM_CHAT_ID,
            text="That topic is no longer available. Run /run for a fresh list.",
        )
        return

    topic = Topic(**topics[topic_index])
    await bot.send_message(
        chat_id=config.TELEGRAM_CHAT_ID,
        text=f"📝 Researching & drafting:\n*{_esc(topic.title)}*\n\nThis takes ~1 minute…",
        parse_mode=ParseMode.MARKDOWN,
    )

    loop = asyncio.get_event_loop()
    # research_topic and write_post are synchronous (blocking httpx) — run off-loop
    brief = await loop.run_in_executor(None, research_topic, topic)
    draft = await loop.run_in_executor(None, write_post, brief)
    post_id, preview_url = await loop.run_in_executor(None, publish_draft, draft)

    state.update(mode="reviewing", active_draft_id=post_id, topics=[])

    await _send_draft_card(bot, post_id, draft.title, draft.description,
                           draft.category, draft.reading_time, preview_url, revised=False)


# ── Step 3: revise the active draft from notes ────────────────────────

async def revise_active_draft(bot: Bot, notes: str) -> bool:
    """
    Revise the draft currently under review using the user's notes.
    Returns True if a revision was performed, False if there's no active draft.
    """
    s = state.load()
    draft_id = s.get("active_draft_id")
    if not draft_id or s.get("mode") != "reviewing":
        return False

    await bot.send_message(
        chat_id=config.TELEGRAM_CHAT_ID,
        text="✏️ Revising the draft with your notes…",
    )

    loop = asyncio.get_event_loop()
    current = await loop.run_in_executor(None, get_draft, draft_id)
    revised = await loop.run_in_executor(None, revise_post, current, notes)
    post_id, preview_url = await loop.run_in_executor(None, update_draft, draft_id, revised)

    await _send_draft_card(bot, post_id, revised.title, revised.description,
                           revised.category, revised.reading_time, preview_url, revised=True)
    return True


# ── Shared: the draft review card ─────────────────────────────────────

async def _send_draft_card(bot: Bot, post_id: str, title: str, description: str,
                           category: str, reading_time: str, preview_url: str,
                           revised: bool) -> None:
    header = "♻️ *Draft Revised*" if revised else "🤖 *New Draft Ready*"
    text = (
        f"{header}\n\n"
        f"*{_esc(title)}*\n"
        f"_{_esc(description)}_\n\n"
        f"📁 {category}  ·  ⏱ {reading_time}\n\n"
        f"[👁 Preview]({preview_url})\n\n"
        f"_Approve, discard, or just reply with notes to revise._"
    )
    await bot.send_message(
        chat_id=config.TELEGRAM_CHAT_ID,
        text=text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_draft_keyboard(post_id),
        disable_web_page_preview=False,
    )
