import pool from '../db/connection.js';

// Obtener todas las citas
export const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.uuid,
        a.date,
        a.status,
        a.notes,
        a.shop_id,
        a.barber_id,
        a.client_id,
        a.service_id,
        c.name as client_name,
        b.name as barber_name,
        s.name as service_name,
        bs.name as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.id
      LEFT JOIN users b ON a.barber_id = b.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN barber_shops bs ON a.shop_id = bs.id
      ORDER BY a.date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener citas' });
  }
};

// Obtener citas por cliente
export const getAppointmentsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        a.id,
        a.uuid,
        a.date,
        a.status,
        a.notes,
        a.shop_id,
        a.barber_id,
        a.client_id,
        a.service_id,
        b.name as barber_name,
        ms.name as service_name,
        bs.name as shop_name
      FROM appointments a
      LEFT JOIN users b ON a.barber_id = b.id
      LEFT JOIN services ms ON a.service_id = ms.id
      LEFT JOIN barber_shops bs ON a.shop_id = bs.id
      WHERE a.client_id = $1
      ORDER BY a.date DESC
    `, [clientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas por cliente:', error);
    res.status(500).json({ message: 'Error del servidor al obtener citas por cliente' });
  }
};

// Obtener citas por barbero
export const getAppointmentsByBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    
    const result = await pool.query(`
      SELECT a.*,
             c.nombre as client_name,
             s.nombre as service_name,
             bs.nombre as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN barber_shops bs ON a.shop_id = bs.id
      WHERE a.barber_id = $1
      ORDER BY a.fecha DESC, a.hora
    `, [barberId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas por barbero:', error);
    res.status(500).json({ message: 'Error del servidor al obtener citas por barbero' });
  }
};

// Obtener citas por tienda
export const getAppointmentsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const result = await pool.query(`
      SELECT a.*,
             c.nombre as client_name,
             b.nombre as barber_name,
             s.nombre as service_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.id
      LEFT JOIN users b ON a.barber_id = b.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.shop_id = $1
      ORDER BY a.fecha DESC, a.hora
    `, [shopId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas por tienda:', error);
    res.status(500).json({ message: 'Error del servidor al obtener citas por tienda' });
  }
};

// Obtener cita por ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT a.*,
             c.nombre as client_name,
             b.nombre as barber_name,
             s.nombre as service_name,
             bs.nombre as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.id
      LEFT JOIN users b ON a.barber_id = b.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN barber_shops bs ON a.shop_id = bs.id
      WHERE a.id = $1 OR a.uuid = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cita por ID:', error);
    res.status(500).json({ message: 'Error del servidor al obtener cita' });
  }
};

// Crear una nueva cita
export const createAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      fecha,
      hora,
      client_id,
      barber_id,
      service_id,
      shop_id,
      estado,
      notas
    } = req.body;
    
    // Verificar disponibilidad del barbero
    const disponibilidadCheck = await client.query(`
      SELECT * FROM appointments
      WHERE barber_id = $1
      AND date = $2
      AND time = $3
      AND status != 'cancelled'
    `, [barber_id, fecha, hora]);
    
    if (disponibilidadCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El barbero ya tiene una cita en ese horario' });
    }
    
    // Obtener duración del servicio
    let duracion = 30; // Duración por defecto
    const serviceCheck = await client.query(`
      SELECT duration_minutes
      FROM shop_services
      WHERE shop_service_id = $1
    `, [service_id]);
    
    if (serviceCheck.rows.length > 0) {
      duracion = serviceCheck.rows[0].duration_minutes;
    }
    
    // Insertar la cita
    const result = await client.query(`
      INSERT INTO appointments (
        date, 
        time, 
        client_id, 
        barber_id, 
        service_id, 
        shop_id,
        status,
        notes,
        duration_minutes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING appointment_id
    `, [
      fecha,
      hora,
      client_id,
      barber_id,
      service_id,
      shop_id,
      estado || 'pending',
      notas || '',
      duracion
    ]);
    
    // Obtener información detallada de la cita
    const appointmentWithDetails = await client.query(`
      SELECT 
        a.appointment_id as id,
        a.date as fecha,
        a.time as hora,
        a.status as estado,
        a.notes as notas,
        a.shop_id,
        a.barber_id,
        a.client_id,
        a.service_id,
        c.name as client_name,
        b.name as barber_name,
        ms.name as service_name,
        bs.name as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.user_id
      LEFT JOIN users b ON a.barber_id = b.user_id
      LEFT JOIN shop_services ss ON a.service_id = ss.shop_service_id
      LEFT JOIN masterservices ms ON ss.master_service_id = ms.master_service_id
      LEFT JOIN barbershops bs ON a.shop_id = bs.shop_id
      WHERE a.appointment_id = $1
    `, [result.rows[0].appointment_id]);
    
    await client.query('COMMIT');
    
    res.status(201).json(appointmentWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear cita:', error);
    res.status(500).json({ message: 'Error del servidor al crear cita' });
  } finally {
    client.release();
  }
};

// Actualizar una cita
export const updateAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      fecha,
      hora,
      client_id,
      barber_id,
      service_id,
      shop_id,
      estado,
      notas,
      duracion
    } = req.body;
    
    // Verificar que la cita existe
    const checkResult = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    // Si se cambia la fecha/hora/barbero, verificar disponibilidad
    if (fecha && hora && barber_id) {
      const disponibilidadCheck = await client.query(`
        SELECT * FROM appointments
        WHERE barber_id = $1
        AND fecha = $2
        AND hora = $3
        AND id != $4
        AND estado != 'cancelada'
      `, [barber_id, fecha, hora, id]);
      
      if (disponibilidadCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'El barbero ya tiene una cita en ese horario' });
      }
    }
    
    // Actualizar la cita
    const updateQuery = `
      UPDATE appointments 
      SET 
        fecha = COALESCE($1, fecha),
        hora = COALESCE($2, hora),
        client_id = COALESCE($3, client_id),
        barber_id = COALESCE($4, barber_id),
        service_id = COALESCE($5, service_id),
        shop_id = COALESCE($6, shop_id),
        estado = COALESCE($7, estado),
        notas = COALESCE($8, notas),
        duracion = COALESCE($9, duracion),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      fecha,
      hora,
      client_id,
      barber_id,
      service_id,
      shop_id,
      estado,
      notas,
      duracion,
      id
    ]);
    
    // Obtener información detallada de la cita
    const appointmentWithDetails = await client.query(`
      SELECT a.*,
             c.nombre as client_name,
             b.nombre as barber_name,
             s.nombre as service_name,
             bs.nombre as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.id
      LEFT JOIN users b ON a.barber_id = b.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN barber_shops bs ON a.shop_id = bs.id
      WHERE a.id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json(appointmentWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar cita' });
  } finally {
    client.release();
  }
};

// Cancelar una cita
export const cancelAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que la cita existe
    const checkResult = await client.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    // Actualizar estado a cancelada
    const result = await client.query(`
      UPDATE appointments 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE appointment_id = $1
      RETURNING appointment_id
    `, [id]);
    
    // Obtener información detallada de la cita
    const appointmentWithDetails = await client.query(`
      SELECT 
        a.appointment_id as id,
        a.date as fecha,
        a.time as hora,
        a.status as estado,
        a.notes as notas,
        a.shop_id,
        a.barber_id,
        a.client_id,
        a.service_id,
        c.name as client_name,
        b.name as barber_name,
        ms.name as service_name,
        bs.name as shop_name
      FROM appointments a
      LEFT JOIN users c ON a.client_id = c.user_id
      LEFT JOIN users b ON a.barber_id = b.user_id
      LEFT JOIN shop_services ss ON a.service_id = ss.shop_service_id
      LEFT JOIN masterservices ms ON ss.master_service_id = ms.master_service_id
      LEFT JOIN barbershops bs ON a.shop_id = bs.shop_id
      WHERE a.appointment_id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json(appointmentWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ message: 'Error del servidor al cancelar cita' });
  } finally {
    client.release();
  }
};

// Eliminar citas de un cliente por estado
export const deleteAppointmentsByClientAndStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { clientId } = req.params;
    const { keepActive = true } = req.query;
    
    let query = `
      DELETE FROM appointments
      WHERE client_id = $1
    `;
    
    // Si keepActive es true, solo eliminar citas completadas o canceladas
    if (keepActive === 'true') {
      query += ` AND (status = 'completed' OR status = 'cancelled')`;
    }
    
    await client.query(query, [clientId]);
    
    await client.query('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar citas del cliente:', error);
    res.status(500).json({ message: 'Error del servidor al eliminar citas del cliente' });
  } finally {
    client.release();
  }
};
