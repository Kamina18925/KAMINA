import pool from '../db/connection.js';

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.uuid, 
        p.name, 
        p.description, 
        p.price, 
        p.discount_price,
        p.stock, 
        p.shop_id, 
        u.id as barber_id,
        u.name as barber_name, 
        bs.name as shop_name,
        p.image_url,
        p.created_at
      FROM products p
      LEFT JOIN users u ON p.shop_id = u.shop_id AND u.role = 'barber'
      LEFT JOIN barber_shops bs ON p.shop_id = bs.id
      ORDER BY p.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener productos' });
  }
};

// Obtener productos por tienda
export const getProductsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.product_id as id, 
        p.name as nombre, 
        p.description as descripcion, 
        p.price as precio, 
        p.discount_price as oferta,
        p.stock, 
        p.shop_id, 
        p.seller_id as barber_id,
        u.name as barber_name, 
        p.image_url as imagen_url,
        p.category
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.user_id
      WHERE p.shop_id = $1
      ORDER BY p.name
    `, [shopId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos por tienda:', error);
    res.status(500).json({ message: 'Error del servidor al obtener productos por tienda' });
  }
};

// Obtener productos por barbero
export const getProductsByBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.product_id as id, 
        p.name as nombre, 
        p.description as descripcion, 
        p.price as precio, 
        p.discount_price as oferta,
        p.stock, 
        p.shop_id, 
        p.seller_id as barber_id,
        b.name as shop_name, 
        p.image_url as imagen_url,
        p.category
      FROM products p
      LEFT JOIN barbershops b ON p.shop_id = b.shop_id
      WHERE p.seller_id = $1
      ORDER BY p.name
    `, [barberId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos por barbero:', error);
    res.status(500).json({ message: 'Error del servidor al obtener productos por barbero' });
  }
};

// Obtener producto por ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.product_id as id, 
        p.name as nombre, 
        p.description as descripcion, 
        p.price as precio, 
        p.discount_price as oferta,
        p.stock, 
        p.shop_id, 
        p.seller_id as barber_id,
        u.name as barber_name, 
        b.name as shop_name,
        p.image_url as imagen_url,
        p.category
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN barbershops b ON p.shop_id = b.shop_id
      WHERE p.product_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({ message: 'Error del servidor al obtener producto' });
  }
};

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Extraer los datos según la estructura payload.productData identificada
    // en la memoria como formato esperado por el reducer
    const productData = req.body.productData || req.body;
    const shopId = req.body.shopId || productData.shop_id;
    const barberId = req.body.barberId || req.body.ownerOrBarberId || productData.barber_id;
    
    const {
      nombre,
      descripcion,
      precio,
      oferta,
      stock,
      imagen_url
    } = productData;
    
    // Generar un UUID para el producto
    const uuid = require('uuid').v4();
    
    // Insertar el producto
    const result = await client.query(`
      INSERT INTO products (
        uuid,
        name, 
        description, 
        price, 
        discount_price, 
        stock, 
        shop_id, 
        image_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      uuid,
      nombre,
      descripcion,
      precio,
      oferta,
      stock || 0,
      shopId,
      imagen_url
    ]);
    
    // Obtener información adicional sobre la barbería y el barbero
    const productWithDetails = await client.query(`
      SELECT 
        p.product_id as id, 
        p.name as nombre, 
        p.description as descripcion, 
        p.price as precio, 
        p.discount_price as oferta,
        p.stock, 
        p.shop_id, 
        p.seller_id as barber_id,
        u.name as barber_name, 
        b.name as shop_name,
        p.image_url as imagen_url,
        p.category
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN barbershops b ON p.shop_id = b.shop_id
      WHERE p.product_id = $1
    `, [result.rows[0].product_id]);
    
    await client.query('COMMIT');
    
    res.status(201).json(productWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error del servidor al crear producto' });
  } finally {
    client.release();
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      oferta,
      stock,
      shop_id,
      barber_id,
      imagen_url,
      category
    } = req.body;
    
    // Verificar que el producto existe
    const checkResult = await client.query('SELECT * FROM products WHERE product_id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Actualizar el producto
    const result = await client.query(`
      UPDATE products 
      SET 
        name = $1, 
        description = $2, 
        price = $3, 
        discount_price = $4, 
        stock = $5, 
        shop_id = $6, 
        seller_id = $7, 
        image_url = $8,
        category = $9,
        updated_at = NOW()
      WHERE product_id = $10
      RETURNING product_id
    `, [
      nombre,
      descripcion,
      precio,
      oferta,
      stock,
      shop_id,
      barber_id, // El vendedor es el barbero
      imagen_url,
      category,
      id
    ]);
    
    // Obtener información adicional sobre la barbería y el barbero
    const productWithDetails = await client.query(`
      SELECT 
        p.product_id as id, 
        p.name as nombre, 
        p.description as descripcion, 
        p.price as precio, 
        p.discount_price as oferta,
        p.stock, 
        p.shop_id, 
        p.seller_id as barber_id,
        u.name as barber_name, 
        b.name as shop_name,
        p.image_url as imagen_url,
        p.category
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN barbershops b ON p.shop_id = b.shop_id
      WHERE p.product_id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json(productWithDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar producto' });
  } finally {
    client.release();
  }
};

// Eliminar un producto
export const deleteProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que el producto existe
    const checkResult = await client.query('SELECT * FROM products WHERE product_id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Eliminar el producto
    await client.query('DELETE FROM products WHERE product_id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error del servidor al eliminar producto' });
  } finally {
    client.release();
  }
};
