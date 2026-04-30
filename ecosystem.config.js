module.exports = {
  apps: [
    {
      name: 'liminal',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: '/var/log/liminal/error.log',
      out_file: '/var/log/liminal/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
