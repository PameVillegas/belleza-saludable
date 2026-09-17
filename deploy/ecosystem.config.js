module.exports = {
  apps: [
    {
      name: 'belleza-saludable',
      script: 'backend/server.js',
      cwd: '/var/www/belleza-saludable',
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
      // Los logs se guardan acá
      out_file: '/var/log/belleza-saludable/out.log',
      error_file: '/var/log/belleza-saludable/error.log',
      merge_logs: true,
      time: true
    }
  ]
};
