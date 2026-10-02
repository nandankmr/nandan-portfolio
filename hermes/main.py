"""
Hermes daily research pipeline.

Triggered by cron at 01:30 UTC (07:00 IST). This is the daily kickoff: it
discovers topics and sends the numbered selection list to Telegram. The user
then taps a topic to research + draft (handled interactively by bot.py /
pipeline.py). The same selection list is also reachable on demand via /run.

Flow:
  discover → send topic list to Telegram → (user picks → research → draft)
"""

import asyncio
import logging
import sys
from pathlib import Path

# Ensure hermes/ is importable when called by cron
sys.path.insert(0, str(Path(__file__).parent))

import config
import state

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.LOG_FILE, mode="a"),
    ],
)
logger = logging.getLogger(__name__)


def run_pipeline() -> None:
    """Daily kickoff: discover topics and present the selection list. Raises on failure."""
    logger.info("=" * 60)
    logger.info("Hermes daily topic discovery starting")
    logger.info("=" * 60)

    from telegram import Bot
    from pipeline import send_topic_list

    async def _kickoff() -> None:
        bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
        await send_topic_list(bot)

    asyncio.run(_kickoff())

    state.mark_run("success")
    logger.info("Topic list sent. Awaiting selection in Telegram.")


def main() -> None:
    try:
        run_pipeline()
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        state.mark_run("error", str(e))

        # Best-effort failure notification
        try:
            from telegram import Bot

            async def _notify_err() -> None:
                bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
                await bot.send_message(
                    chat_id=config.TELEGRAM_CHAT_ID,
                    text=f"❌ *Hermes pipeline failed*\n\n`{str(e)[:500]}`",
                    parse_mode="Markdown",
                )

            asyncio.run(_notify_err())
        except Exception:
            pass

        sys.exit(1)


if __name__ == "__main__":
    main()
