import pool from '../db/connection.js';

/**
 * Middleware para verificar sesiones de usuario
 * Verifica que el token enviado en headers.authorization sea válido y no haya expirado
 */
export const verifySession = async (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    console.log('Error de autenticación: No se proporcionó token');
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }
  
  try {
    // Buscar la sesión en la base de datos
    const sessionQuery = await pool.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (sessionQuery.rows.length === 0) {
      console.log('Error de autenticación: Token inválido o expirado');
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
    
    // Si la sesión es válida, agregar el ID del usuario al request
    req.userId = sessionQuery.rows[0].user_id;
    console.log(`Sesión verificada para usuario ID: ${req.userId}`);
    
    // Continuar con la siguiente función
    next();
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return res.status(500).json({ error: 'Error del servidor al verificar la sesión' });
  }
};

/**
 * Middleware opcional para renovar automáticamente la sesión
 * Extiende el tiempo de expiración de la sesión actual
 */
export const renewSession = async (req, res, next) => {
  const token = req.headers.authorization;
  
  if (token) {
    try {
      // Extender la fecha de expiración por 24 horas más
      const newExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await pool.query(
        'UPDATE sessions SET expires_at = $1 WHERE token = $2',
        [newExpiryDate, token]
      );
      
      console.log('Sesión renovada automáticamente');
    } catch (error) {
      console.error('Error al renovar sesión:', error);
      // No devolvemos error para no interrumpir el flujo
    }
  }
  
  next();
};
