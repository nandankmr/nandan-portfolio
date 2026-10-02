#!/bin/bash
# Sets up Hermes on the server at /home/ubuntu/hermes/.
# Run once after deploying. Safe to re-run.
set -euo pipefail

HERMES_DIR="/home/ubuntu/hermes"
VENV_DIR="$HERMES_DIR/venv"

echo "→ Creating Python virtualenv…"
python3 -m venv "$VENV_DIR"

echo "→ Installing dependencies…"
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install -r "$HERMES_DIR/requirements.txt"

echo "→ Checking .env…"
if [ ! -f "$HERMES_DIR/.env" ]; then
  echo "  WARN: $HERMES_DIR/.env not found — copy .env.example and fill in values"
  echo "  cp $HERMES_DIR/.env.example $HERMES_DIR/.env"
  echo "  nano $HERMES_DIR/.env"
fi

echo "→ Installing cron job (01:30 UTC daily)…"
CRON_CMD="30 1 * * * cd $HERMES_DIR && $VENV_DIR/bin/python3 main.py >> /home/ubuntu/hermes/cron.log 2>&1"
# Add only if not already present
(crontab -l 2>/dev/null | grep -v "hermes/main.py"; echo "$CRON_CMD") | crontab -
echo "  Cron registered: $CRON_CMD"

echo "→ Starting Hermes bot via PM2…"
pm2 start "$HERMES_DIR/ecosystem.config.js"
pm2 save

echo ""
echo "✓ Hermes setup complete."
echo ""
echo "Useful commands:"
echo "  pm2 logs hermes-bot          — tail bot logs"
echo "  pm2 restart hermes-bot       — restart the bot"
echo "  crontab -l                   — check cron"
echo "  $VENV_DIR/bin/python3 $HERMES_DIR/main.py  — test a manual run"
