import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import crypto from 'crypto';

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
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false, 
        message: 'Credenciales inválidas'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generate a unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Store session in database
    // Create the sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert the new session
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.user_id, sessionToken, new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 hours
    );
    
    // Return user info and session token (excluding password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      user: userWithoutPassword,
      sessionToken: sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verify active session
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Create the validate_session function if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE FUNCTION validate_session(token_param TEXT)
      RETURNS TABLE (
        is_valid BOOLEAN,
        user_id INTEGER,
        user_uuid UUID,
        name TEXT,
        email TEXT,
        role TEXT,
        phone TEXT,
        shop_id INTEGER,
        expires_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (s.expires_at > NOW()) as is_valid,
          u.user_id,
          u.user_uuid,
          u.name,
          u.email,
          u.role,
          u.phone,
          u.shop_id,
          s.expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.token = token_param
        LIMIT 1;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify token in database using the function
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

    // Return user data
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