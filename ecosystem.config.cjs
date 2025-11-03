module.exports = {
  apps: [
    {
      name: 'cafe-colombia-api',
      script: './api/dist/server.js',
      instances: 'max', // Usar todos los cores disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Configuración de logs
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      
      // Configuración de memoria y reinicio
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Configuración de monitoreo
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'backups'],
      
      // Variables de entorno específicas
      env_file: '.env',
      
      // Configuración de cluster
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configuración de autorestart
      autorestart: true,
      
      // Configuración de cron para tareas programadas
      cron_restart: '0 2 * * *', // Reiniciar a las 2 AM todos los días
      
      // Configuración de merge logs
      merge_logs: true,
      
      // Configuración de source map
      source_map_support: true,
      
      // Configuración de interpretador
      interpreter: 'node',
      interpreter_args: '--max-old-space-size=1024'
    }
  ],
  
  // Configuración de despliegue
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:SSALAZARCA/CAFECOLOMBIAAPP.git',
      path: '/var/www/cafecolombiaapp',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};