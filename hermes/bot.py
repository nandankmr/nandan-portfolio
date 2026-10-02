"""
Hermes Telegram bot — runs 24/7 under PM2.

Interactive flow:
  /run (or daily cron) → topic list → tap a number → research + draft
  → review card → reply with notes to revise, or Approve / Discard.

Commands:
  /help    — available commands
  /status  — last run time, pending drafts count
  /run     — discover topics and send the selection list
  /list    — list pending drafts with preview links
  /approve <id>  — approve by UUID prefix
  /discard <id>  — discard by UUID prefix
"""

import asyncio
import logging
import sys
from pathlib import Path

# Ensure hermes/ is on the path when invoked directly
sys.path.insert(0, str(Path(__file__).parent))

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import config
import state
from pipeline import research_and_publish, revise_active_draft, send_topic_list
from publisher import approve_draft, discard_draft, list_drafts

logger = logging.getLogger(__name__)


# ── Auth guard ────────────────────────────────────────────────────────

def _authorized(update: Update) -> bool:
    """Ignore messages from anyone except the configured chat."""
    chat = update.effective_chat
    return bool(chat and chat.id == config.TELEGRAM_CHAT_ID)


# ── Keyboard factory ──────────────────────────────────────────────────

def _draft_keyboard(post_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Approve", callback_data=f"approve:{post_id}"),
        InlineKeyboardButton("❌ Discard", callback_data=f"discard:{post_id}"),
    ]])


# ── Commands ──────────────────────────────────────────────────────────

async def cmd_help(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    await update.message.reply_text(
        "*Hermes — commands*\n\n"
        "/run — find topics, then you pick one to draft\n"
        "/status — last run and pending drafts\n"
        "/list — list pending drafts\n"
        "/approve `<id>` — approve by ID prefix\n"
        "/discard `<id>` — discard by ID prefix\n"
        "/help — this message\n\n"
        "_When a draft is under review, just reply with notes "
        "(plain text) and I'll revise it._",
        parse_mode=ParseMode.MARKDOWN,
    )


async def cmd_status(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return

    s = state.load()
    last_run = s.get("last_run", "never")
    last_status = s.get("last_status", "—")
    last_error = s.get("last_error", "")

    try:
        drafts = list_drafts()
        draft_count = len(drafts)
    except Exception as e:
        draft_count = f"? ({e})"

    lines = [
        "*Hermes Status*",
        f"Last run: `{last_run}`",
        f"Result: `{last_status}`",
        f"Pending drafts: `{draft_count}`",
    ]
    if last_error:
        lines.append(f"\n⚠️ Last error:\n`{last_error[:300]}`")

    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_list(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return

    try:
        drafts = list_drafts()
    except Exception as e:
        await update.message.reply_text(f"❌ Could not fetch drafts: {e}")
        return

    if not drafts:
        await update.message.reply_text("No pending drafts.")
        return

    await update.message.reply_text(f"📋 *{len(drafts)} pending draft(s):*", parse_mode=ParseMode.MARKDOWN)

    for post in drafts:
        preview_url = _make_preview_url(post)
        text = (
            f"📝 *{_esc(post['title'])}*\n"
            f"ID: `{post['id'][:8]}…`\n"
            f"Category: {post.get('category', '—')}\n"
            f"[👁 Preview]({preview_url})"
        )
        await update.message.reply_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=_draft_keyboard(post["id"]),
            disable_web_page_preview=True,
        )


async def cmd_run(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    # Discover topics and present the selection list (runs in background)
    asyncio.create_task(_safe(ctx.bot, send_topic_list(ctx.bot)))


async def cmd_approve(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    args = ctx.args or []
    if not args:
        await update.message.reply_text("Usage: /approve `<id_prefix>`", parse_mode=ParseMode.MARKDOWN)
        return
    await _approve_by_prefix(args[0], update.message.reply_text)


async def cmd_discard(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    args = ctx.args or []
    if not args:
        await update.message.reply_text("Usage: /discard `<id_prefix>`", parse_mode=ParseMode.MARKDOWN)
        return
    await _discard_by_prefix(args[0], update.message.reply_text)


# ── Inline keyboard callback ──────────────────────────────────────────

async def on_callback(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query:
        return
    if not _authorized(update):
        await query.answer("Unauthorized", show_alert=True)
        return

    await query.answer()  # dismiss the loading spinner immediately
    data = query.data or ""

    if data.startswith("topic:"):
        idx = int(data.split(":", 1)[1])
        # Remove the selection buttons so it can't be tapped twice
        try:
            await query.edit_message_reply_markup(reply_markup=None)
        except Exception:
            pass
        asyncio.create_task(_safe(query.get_bot(), research_and_publish(query.get_bot(), idx)))

    elif data.startswith("approve:"):
        post_id = data.split(":", 1)[1]
        try:
            result = approve_draft(post_id)
            title = result.get("post", {}).get("title", post_id[:8])
            await query.edit_message_reply_markup(reply_markup=None)
            state.update(mode="idle", active_draft_id=None)
            await query.message.reply_text(
                f"✅ *Published:* {_esc(title)}", parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            await query.message.reply_text(f"❌ Approve failed: {e}")

    elif data.startswith("discard:"):
        post_id = data.split(":", 1)[1]
        try:
            result = discard_draft(post_id)
            title = result.get("post", {}).get("title", post_id[:8])
            await query.edit_message_reply_markup(reply_markup=None)
            state.update(mode="idle", active_draft_id=None)
            await query.message.reply_text(
                f"🗑 *Discarded:* {_esc(title)}", parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            await query.message.reply_text(f"❌ Discard failed: {e}")


# ── Plain-text handler: revision notes while a draft is under review ──

async def on_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    if not update.message or not update.message.text:
        return

    notes = update.message.text.strip()
    s = state.load()

    if s.get("mode") == "reviewing" and s.get("active_draft_id"):
        asyncio.create_task(_safe(ctx.bot, revise_active_draft(ctx.bot, notes)))
    else:
        await update.message.reply_text(
            "Nothing under review right now. Send /run to find topics to draft."
        )


# ── Helpers ───────────────────────────────────────────────────────────

def _make_preview_url(post: dict) -> str:
    token = post.get("preview_token", "")
    return f"{config.BLOG_PUBLIC_BASE}/preview/{post['id']}?token={token}"


def _esc(text: str) -> str:
    """Minimal Markdown escaping for bold text."""
    return text.replace("*", "\\*").replace("_", "\\_")


async def _approve_by_prefix(prefix: str, reply) -> None:
    try:
        drafts = list_drafts()
        matches = [p for p in drafts if p["id"].startswith(prefix)]
        if not matches:
            await reply(f"No draft found with ID starting with `{prefix}`", parse_mode=ParseMode.MARKDOWN)
            return
        if len(matches) > 1:
            await reply("Multiple matches — provide more characters of the ID")
            return
        post = matches[0]
        approve_draft(post["id"])
        await reply(f"✅ Published: *{_esc(post['title'])}*", parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        await reply(f"❌ Failed: {e}")


async def _discard_by_prefix(prefix: str, reply) -> None:
    try:
        drafts = list_drafts()
        matches = [p for p in drafts if p["id"].startswith(prefix)]
        if not matches:
            await reply(f"No draft found with ID starting with `{prefix}`", parse_mode=ParseMode.MARKDOWN)
            return
        if len(matches) > 1:
            await reply("Multiple matches — provide more characters of the ID")
            return
        post = matches[0]
        discard_draft(post["id"])
        await reply(f"🗑 Discarded: *{_esc(post['title'])}*", parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        await reply(f"❌ Failed: {e}")


async def _safe(bot: Bot, coro) -> None:
    """
    Await a pipeline coroutine, reporting any exception to the user instead of
    letting it die silently in a fire-and-forget task.
    """
    try:
        await coro
    except Exception as e:
        logger.error(f"Background task failed: {e}", exc_info=True)
        try:
            await bot.send_message(
                chat_id=config.TELEGRAM_CHAT_ID,
                text=f"❌ Something went wrong:\n`{str(e)[:400]}`",
                parse_mode=ParseMode.MARKDOWN,
            )
        except Exception:
            pass


# ── Entry point ───────────────────────────────────────────────────────

def run_bot() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    app = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler(["start", "help"], cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("run", cmd_run))
    app.add_handler(CommandHandler("approve", cmd_approve))
    app.add_handler(CommandHandler("discard", cmd_discard))
    app.add_handler(CallbackQueryHandler(on_callback))
    # Plain-text replies = revision notes for the draft under review
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    logger.info("Hermes bot starting (polling mode)…")
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    run_bot()
