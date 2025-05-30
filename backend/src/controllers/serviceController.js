import pool from '../db/connection.js';

// Obtener todos los servicios
export const getAllServices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.uuid,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.shop_id,
        bs.name as shop_name
      FROM services s
      LEFT JOIN barber_shops bs ON s.shop_id = bs.id
      ORDER BY s.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ message: 'Error del servidor al obtener servicios' });
  }
};

// Obtener servicios por barbería
export const getServicesByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.uuid,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.shop_id,
        bs.name as shop_name
      FROM services s
      LEFT JOIN barber_shops bs ON s.shop_id = bs.id
      WHERE s.shop_id = $1
      ORDER BY s.name
        ss.shop_id,
        b.name as shop_name
      FROM shop_services ss
      JOIN masterservices ms ON ss.master_service_id = ms.master_service_id
      JOIN barbershops b ON ss.shop_id = b.shop_id
      WHERE ss.shop_id = $1
      ORDER BY ms.name
    `, [shopId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener servicios por barbería:', error);
    res.status(500).json({ message: 'Error del servidor al obtener servicios por barbería' });
  }
};

// Obtener servicio por ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primero verificar si es un servicio de tienda
    const shopServiceResult = await pool.query(`
      SELECT 
        ss.shop_service_id as id,
        ms.name as nombre,
        ms.description as descripcion,
        ss.price as precio,
        ss.duration_minutes as duracion,
        ss.shop_id,
        b.name as shop_name
      FROM shop_services ss
      JOIN masterservices ms ON ss.master_service_id = ms.master_service_id
      JOIN barbershops b ON ss.shop_id = b.shop_id
      WHERE ss.shop_service_id = $1
    `, [id]);
    
    if (shopServiceResult.rows.length > 0) {
      return res.json(shopServiceResult.rows[0]);
    }
    
    // Si no es un servicio de tienda, verificar si es un servicio maestro
    const masterServiceResult = await pool.query(`
      SELECT 
        master_service_id as id,
        name as nombre,
        description as descripcion,
        base_price as precio,
        base_duration_minutes as duracion,
        'global' as tipo
      FROM masterservices
      WHERE master_service_id = $1
    `, [id]);
    
    if (masterServiceResult.rows.length > 0) {
      return res.json(masterServiceResult.rows[0]);
    }
    
    return res.status(404).json({ message: 'Servicio no encontrado' });
  } catch (error) {
    console.error('Error al obtener servicio por ID:', error);
    res.status(500).json({ message: 'Error del servidor al obtener servicio' });
  }
};

// Crear un nuevo servicio para una barbería
export const createService = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      nombre,
      descripcion,
      precio,
      duracion,
      shop_id,
      master_service_id
    } = req.body;
    
    // Si no se proporciona un master_service_id, primero creamos un master service
    let masterServiceId = master_service_id;
    
    if (!masterServiceId) {
      const masterServiceResult = await client.query(`
        INSERT INTO masterservices (
          name, 
          description, 
          base_price, 
          base_duration_minutes, 
          is_global
        ) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING master_service_id
      `, [
        nombre,
        descripcion,
        precio,
        duracion,
        false // No es global porque es específico para esta tienda
      ]);
      
      masterServiceId = masterServiceResult.rows[0].master_service_id;
    }
    
    // Insertar el servicio en la tienda
    const result = await client.query(`
      INSERT INTO shop_services (
        shop_id,
        master_service_id,
        price,
        duration_minutes
      ) 
      VALUES ($1, $2, $3, $4)
      RETURNING shop_service_id
    `, [
      shop_id,
      masterServiceId,
      precio,
      duracion
    ]);
    
    // Obtener información completa del servicio
    const serviceWithDetails = await client.query(`
      SELECT 
        ss.shop_service_id as id,
        ms.name as nombre,
        ms.description as descripcion,
        ss.price as precio,
        ss.duration_minutes as duracion,
        ss.shop_id,
        b.name as shop_name
      FROM shop_services ss
      JOIN masterservices ms ON ss.master_service_id = ms.master_service_id
      JOIN barbershops b ON ss.shop_id = b.shop_id
      WHERE ss.shop_service_id = $1
    `, [result.rows[0].shop_service_id]);
    
    await client.query('COMMIT');
    
    res.status(201).json(serviceWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear servicio:', error);
    res.status(500).json({ message: 'Error del servidor al crear servicio' });
  } finally {
    client.release();
  }
};

// Actualizar un servicio
export const updateService = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      duracion,
      shop_id,
      categoria,
      imagen_url
    } = req.body;
    
    // Verificar que el servicio existe
    const checkResult = await client.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Actualizar el servicio
    const result = await client.query(`
      UPDATE services 
      SET 
        nombre = $1, 
        descripcion = $2, 
        precio = $3, 
        duracion = $4, 
        shop_id = $5, 
        categoria = $6,
        imagen_url = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [
      nombre,
      descripcion,
      precio,
      duracion,
      shop_id,
      categoria,
      imagen_url,
      id
    ]);
    
    // Obtener información adicional sobre la barbería
    const serviceWithDetails = await client.query(`
      SELECT s.*, bs.nombre as shop_name
      FROM services s
      LEFT JOIN barber_shops bs ON s.shop_id = bs.id
      WHERE s.id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json(serviceWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar servicio' });
  } finally {
    client.release();
  }
};

// Eliminar un servicio
export const deleteService = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que el servicio existe
    const checkResult = await client.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Verificar si hay citas asociadas a este servicio
    const appointmentsCheck = await client.query('SELECT * FROM appointments WHERE service_id = $1 LIMIT 1', [id]);
    
    if (appointmentsCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No se puede eliminar el servicio porque tiene citas asociadas' });
    }
    
    // Eliminar el servicio
    await client.query('DELETE FROM services WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ message: 'Error del servidor al eliminar servicio' });
  } finally {
    client.release();
  }
};
