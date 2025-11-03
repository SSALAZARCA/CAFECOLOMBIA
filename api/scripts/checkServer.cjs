const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.CHECK_PORT || 3002;

// Configuración básica
app.use(cors());
app.use(express.json());

// Health check básico (sin base de datos)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'not_tested'
  });
});

// Endpoint de información
app.get('/api', (req, res) => {
  res.json({
    message: 'Café Colombia API Server - Verificación',
    version: process.env.APP_VERSION || '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    note: 'Servidor funcionando. Configure la base de datos para funcionalidad completa.'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('🚀 Servidor de verificación iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('✅ El servidor backend está funcionando correctamente');
  console.log('📋 Próximos pasos:');
  console.log('   1. Configura la contraseña de MySQL en api/.env');
  console.log('   2. Ejecuta: npm run mysql:test');
  console.log('   3. Ejecuta: npm run mysql:setup');
  console.log('   4. Ejecuta: npm run server:dev');
  console.log('');
});

// Cerrar servidor después de 5 segundos
setTimeout(() => {
  console.log('🛑 Cerrando servidor de verificación...');
  server.close(() => {
    console.log('✅ Verificación completada exitosamente');
    process.exit(0);
  });
}, 5000)