import pool from '../db/connection.js';

// Obtener todas las barberías
export const getAllBarberShops = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        bs.id, 
        bs.uuid, 
        bs.name, 
        bs.address, 
        bs.schedule,
        bs.rating, 
        u.name as owner_name,
        u.id as owner_id
      FROM barber_shops bs
      LEFT JOIN users u ON bs.owner_id = u.id
      ORDER BY bs.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener barberías:', error);
    res.status(500).json({ message: 'Error del servidor al obtener barberías' });
  }
};

// Obtener barberías por propietario
export const getBarberShopsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, 
        uuid, 
        name, 
        address,
        schedule,
        rating,
        owner_id
      FROM barber_shops
      WHERE owner_id = $1
      ORDER BY name
    `, [ownerId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener barberías por propietario:', error);
    res.status(500).json({ message: 'Error del servidor al obtener barberías por propietario' });
  }
};

// Obtener barbería por ID
export const getBarberShopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.shop_id as id, 
        b.name as nombre, 
        b.address as direccion, 
        b.city as ciudad,
        b.phone as telefono, 
        u.name as owner_name,
        b.owner_id
      FROM barbershops b
      LEFT JOIN users u ON b.owner_id = u.user_id
      WHERE b.shop_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Barbería no encontrada' });
    }
    
    // Obtener los barberos asociados a la barbería
    const barbersResult = await pool.query(`
      SELECT 
        u.user_id as id, 
        u.name as nombre, 
        u.email, 
        u.phone as telefono, 
        u.role
      FROM barber_assignments ba
      JOIN users u ON ba.barber_id = u.user_id
      WHERE ba.shop_id = $1
    `, [id]);
    
    // Obtener los servicios ofrecidos por la barbería
    const servicesResult = await pool.query(`
      SELECT 
        s.shop_service_id as id,
        ms.name as nombre,
        ms.description as descripcion,
        s.price as precio,
        s.duration_minutes as duracion
      FROM shop_services s
      JOIN masterservices ms ON s.master_service_id = ms.master_service_id
      WHERE s.shop_id = $1
    `, [id]);
    
    // Combinar toda la información
    const barberShop = {
      ...result.rows[0],
      barbers: barbersResult.rows,
      services: servicesResult.rows
    };
    
    res.json(barberShop);
  } catch (error) {
    console.error('Error al obtener barbería por ID:', error);
    res.status(500).json({ message: 'Error del servidor al obtener barbería' });
  }
};

// Crear una nueva barbería
export const createBarberShop = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      nombre,
      direccion,
      ciudad,
      telefono,
      owner_id,
      barbers
    } = req.body;
    
    // Insertar la barbería
    const result = await client.query(`
      INSERT INTO barbershops (
        name, 
        address, 
        city, 
        phone, 
        owner_id
      ) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING shop_id
    `, [
      nombre,
      direccion,
      ciudad,
      telefono,
      owner_id
    ]);
    
    const barberShopId = result.rows[0].shop_id;
    
    // Si hay barberos, asociarlos a la barbería
    if (barbers && barbers.length > 0) {
      for (const barberId of barbers) {
        await client.query(`
          INSERT INTO barber_assignments (shop_id, barber_id)
          VALUES ($1, $2)
        `, [barberShopId, barberId]);
      }
    }
    
    // Obtener la información completa de la barbería
    const barberShopResult = await client.query(`
      SELECT 
        b.shop_id as id, 
        b.name as nombre, 
        b.address as direccion, 
        b.city as ciudad,
        b.phone as telefono, 
        u.name as owner_name,
        b.owner_id
      FROM barbershops b
      LEFT JOIN users u ON b.owner_id = u.user_id
      WHERE b.shop_id = $1
    `, [barberShopId]);
    
    // Obtener los barberos asociados
    const barbersResult = await client.query(`
      SELECT 
        u.user_id as id, 
        u.name as nombre, 
        u.email, 
        u.phone as telefono, 
        u.role
      FROM barber_assignments ba
      JOIN users u ON ba.barber_id = u.user_id
      WHERE ba.shop_id = $1
    `, [barberShopId]);
    
    await client.query('COMMIT');
    
    // Combinar la información
    const barberShop = {
      ...barberShopResult.rows[0],
      barbers: barbersResult.rows
    };
    
    res.status(201).json(barberShop);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear barbería:', error);
    res.status(500).json({ message: 'Error del servidor al crear barbería' });
  } finally {
    client.release();
  }
};

// Actualizar una barbería
export const updateBarberShop = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      nombre,
      direccion,
      telefono,
      horario,
      descripcion,
      imagen_url,
      owner_id,
      barbers
    } = req.body;
    
    // Verificar que la barbería existe
    const checkResult = await client.query('SELECT * FROM barber_shops WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Barbería no encontrada' });
    }
    
    // Actualizar la barbería
    const updateQuery = `
      UPDATE barber_shops 
      SET 
        nombre = $1, 
        direccion = $2, 
        telefono = $3, 
        horario = $4, 
        descripcion = $5, 
        imagen_url = $6,
        owner_id = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      nombre,
      direccion,
      telefono,
      horario,
      descripcion,
      imagen_url,
      owner_id,
      id
    ]);
    
    // Si hay barberos, actualizar las asociaciones
    if (barbers) {
      // Eliminar asociaciones existentes
      await client.query('DELETE FROM barber_shop_barbers WHERE shop_id = $1', [id]);
      
      // Crear nuevas asociaciones
      for (const barberId of barbers) {
        await client.query(`
          INSERT INTO barber_shop_barbers (shop_id, barber_id)
          VALUES ($1, $2)
        `, [id, barberId]);
      }
    }
    
    // Obtener la información completa de la barbería
    const barberShopResult = await client.query(`
      SELECT bs.*, u.nombre as owner_name
      FROM barber_shops bs
      LEFT JOIN users u ON bs.owner_id = u.id
      WHERE bs.id = $1
    `, [id]);
    
    // Obtener los barberos asociados
    const barbersResult = await client.query(`
      SELECT u.id, u.uuid, u.nombre, u.email, u.telefono, u.role
      FROM barber_shop_barbers bsb
      JOIN users u ON bsb.barber_id = u.id
      WHERE bsb.shop_id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    // Combinar la información
    const barberShop = {
      ...barberShopResult.rows[0],
      barbers: barbersResult.rows
    };
    
    res.json(barberShop);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar barbería:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar barbería' });
  } finally {
    client.release();
  }
};

// Eliminar una barbería
export const deleteBarberShop = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que la barbería existe
    const checkResult = await client.query('SELECT * FROM barber_shops WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Barbería no encontrada' });
    }
    
    // Eliminar las asociaciones con barberos
    await client.query('DELETE FROM barber_shop_barbers WHERE shop_id = $1', [id]);
    
    // Eliminar la barbería
    await client.query('DELETE FROM barber_shops WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar barbería:', error);
    res.status(500).json({ message: 'Error del servidor al eliminar barbería' });
  } finally {
    client.release();
  }
};
