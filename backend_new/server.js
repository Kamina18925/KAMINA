// server.js - Servidor backend en puerto 3001
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/database');
require('dotenv').config();

const app = express();

// Configuración CORS para permitir conexiones desde el frontend (puerto 5173 para Vite)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

// Rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend funcionando correctamente en puerto 3001',
    timestamp: new Date().toISOString(),
    database: process.env.DB_NAME,
    user: process.env.DB_USER
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// Ruta 404
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: `Ruta no encontrada: ${req.originalUrl}` 
  });
});

const PORT = process.env.PORT || 3001;

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    console.log('🔄 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      console.error('Verifica los parámetros de conexión en .env');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('\n🚀 ===== SERVIDOR BACKEND INICIADO =====');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🔗 Base de datos: ${process.env.DB_NAME}`);
      console.log(`👤 Usuario BD: ${process.env.DB_USER}`);
      console.log(`🌐 CORS habilitado para: http://localhost:5173`);
      console.log('✅ Listo para recibir peticiones del frontend');
      console.log('==========================================\n');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
