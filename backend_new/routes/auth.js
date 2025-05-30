// routes/auth.js - Rutas de autenticación
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// POST /api/auth/verify - Verificar sesión activa
router.post('/verify', async (req, res) => {
  try {
    console.log('🔍 Verificando sesión...');

    const { sessionToken } = req.body;

    if (!sessionToken) {
      console.log('❌ Token de sesión faltante');
      return res.status(400).json({ 
        success: false, 
        message: 'Token de sesión requerido' 
      });
    }

    // Buscar sesión activa
    const sessionResult = await pool.query(
      `SELECT s.*, u.id as user_id, u.uuid as user_uuid, u.name, u.email, 
              u.role, u.phone, u.shop_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      console.log('❌ Sesión no encontrada o expirada');
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión inválida o expirada' 
      });
    }

    const session = sessionResult.rows[0];
    console.log('✅ Sesión válida para:', session.name);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Sesión válida',
      user: {
        id: session.user_id,
        uuid: session.user_uuid,
        name: session.name,
        email: session.email,
        role: session.role,
        phone: session.phone,
        shop_id: session.shop_id
      },
      sessionToken: sessionToken
    });

  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// GET /api/auth/test - Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Ruta de auth funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
