// PM2 configuration for Hermes bot process.
// Start with: pm2 start ecosystem.config.js
// The daily cron (main.py) is handled by system cron, not PM2 cron.

module.exports = {
  apps: [
    {
      name: "hermes-bot",
      script: "python3",
      args: "bot.py",
      cwd: "/home/ubuntu/hermes",
      interpreter: "none",

      // Restart on crash, with exponential back-off
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",

      // Logging
      out_file: "/home/ubuntu/hermes/bot.out.log",
      error_file: "/home/ubuntu/hermes/bot.err.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      env: {
        PYTHONUNBUFFERED: "1",
        PYTHONPATH: "/home/ubuntu/hermes",
      },
    },
  ],
};
