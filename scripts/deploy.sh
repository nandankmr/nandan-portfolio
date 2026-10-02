#!/bin/bash
# Deploy to production.
# Syncs source to server, builds there (so NEXT_PUBLIC_* vars are baked in correctly),
# then restarts the PM2 process.

set -euo pipefail

# Host lives outside git (the site sits behind Cloudflare; keep the origin private).
# Put DEPLOY_HOST=user@host and OCI_KEY=/path/to/key in .env.deploy (git-ignored).
[ -f .env.deploy ] && source .env.deploy
SERVER="${DEPLOY_HOST:?Set DEPLOY_HOST in .env.deploy, e.g. user@host}"
KEY="${OCI_KEY:-$HOME/Downloads/ins-me.key}"
REMOTE="/home/ubuntu/portfolio"

echo "→ Syncing source..."
rsync -avz --delete \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='.git' \
  --exclude='*.log' \
  -e "ssh -i $KEY" \
  ./ "$SERVER:$REMOTE/"

echo "→ Installing deps..."
ssh -i "$KEY" "$SERVER" "cd $REMOTE && npm install --legacy-peer-deps"

echo "→ Building on server..."
ssh -i "$KEY" "$SERVER" "cd $REMOTE && npm run build"

echo "→ Verifying build..."
ssh -i "$KEY" "$SERVER" "test -f $REMOTE/.next/BUILD_ID || (echo 'BUILD FAILED: no BUILD_ID' && exit 1)"

echo "→ Restarting PM2..."
ssh -i "$KEY" "$SERVER" "cd $REMOTE && pm2 restart portfolio --update-env"

echo "→ Verifying site is up..."
sleep 3
ssh -i "$KEY" "$SERVER" "curl -sf http://localhost:3000 -o /dev/null && echo 'Site OK' || (echo 'Site DOWN after restart!' && pm2 logs portfolio --lines 20 --nostream && exit 1)"

echo "✓ Deployed."
