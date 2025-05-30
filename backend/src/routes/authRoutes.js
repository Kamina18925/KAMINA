import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import pool from '../db/connection.js';

const router = express.Router();

// Endpoint para verificar si la sesión sigue válida
router.get('/verify', verifySession, async (req, res) => {
  try {
    const userQuery = await pool.query(
      'SELECT id, uuid, name, email, phone, role, specialties, shop_id FROM users WHERE id = $1', 
      [req.userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Formatear la respuesta con campos tanto en español como en inglés
    const user = userQuery.rows[0];
    const userResponse = {
      id: user.id,
      uuid: user.uuid,
      nombre: user.name,
      name: user.name,
      email: user.email,
      telefono: user.phone,
      phone: user.phone,
      rol: user.role,
      role: user.role,
      especialidades: user.specialties || [],
      specialties: user.specialties || [],
      shop_id: user.shop_id
    };
    
    console.log('Sesión verificada correctamente para usuario ID:', req.userId);
    res.json(userResponse);
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ message: 'Error del servidor al verificar sesión' });
  }
});

export default router;
