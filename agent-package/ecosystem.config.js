module.exports = {
  apps: [
    {
      name: 'agent-control-panel',
      script: 'dist/index.js',
      env_file: '.env',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
