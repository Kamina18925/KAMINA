// routes/users.js - Rutas de usuarios
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../config/database');

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login:', { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Email o contraseña faltantes');
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario en la base de datos
    console.log('🔍 Buscando usuario en BD...');
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = userResult.rows[0];
    console.log('✅ Usuario encontrado:', user.name);

    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash || user.password);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token de sesión
    const sessionToken = crypto.randomBytes(32).toString('hex');
    console.log('🎫 Token generado para:', user.name);

    // Crear sesión en la base de datos
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, sessionToken, new Date(Date.now() + 24 * 60 * 60 * 1000)]
    );

    console.log('✅ Login exitoso para:', user.email);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        shop_id: user.shop_id
      },
      sessionToken: sessionToken
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// GET /api/users/test - Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Ruta de usuarios funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
