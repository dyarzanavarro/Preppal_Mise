module.exports = {
  apps: [
    {
      name: 'betterplan',
      script: '.output/server/index.mjs',
      env: { NODE_ENV: 'production', PORT: '3000' },
      max_memory_restart: '512M',
    },
    {
      name: 'coop-xvfb',
      script: '/usr/bin/Xvfb',
      args: ':99 -screen 0 1280x720x24 -ac',
      interpreter: 'none',
      autorestart: true,
    },
    {
      name: 'coop-chrome',
      script: '/usr/bin/chromium',
      args: '--remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir=/var/www/betterplan/.coop-chrome --no-first-run --no-sandbox --disable-dev-shm-usage https://www.coop.ch/de/',
      interpreter: 'none',
      env: { DISPLAY: ':99' },
      autorestart: true,
    },
  ],
}