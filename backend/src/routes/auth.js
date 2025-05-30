import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role = 'client' } = req.body;
  
  try {
    // Check if email already exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role',
      [name, email, passwordHash, phone, role]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar credenciales
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash || user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token único
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Crear sesión en la base de datos
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, sessionToken, new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 horas
    );

    // Retornar usuario Y token de sesión
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
      sessionToken: sessionToken // ← Importante: incluir el token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// GET /api/auth/verify - Verificar sesión activa
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token en la base de datos usando la función que creamos
    const result = await pool.query(
      'SELECT * FROM validate_session($1)',
      [token]
    );

    if (result.rows.length === 0 || !result.rows[0].is_valid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión inválida o expirada' 
      });
    }

    const sessionData = result.rows[0];

    // Retornar datos del usuario
    res.json({
      success: true,
      user: {
        id: sessionData.user_id,
        uuid: sessionData.user_uuid,
        name: sessionData.name,
        email: sessionData.email,
        role: sessionData.role,
        phone: sessionData.phone,
        shop_id: sessionData.shop_id
      },
      expiresAt: sessionData.expires_at
    });

  } catch (error) {
    console.error('Error verificando sesión:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

export default router;