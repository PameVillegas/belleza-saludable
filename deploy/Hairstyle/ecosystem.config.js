module.exports = {
  apps: [
    {
      name: 'hairstyle-abii',
      script: 'server/server.js',
      cwd: '/var/www/hairstyle',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production'
      },
      out_file: '/var/log/hairstyle/out.log',
      error_file: '/var/log/hairstyle/error.log',
      merge_logs: true,
      time: true
    }
  ]
};
