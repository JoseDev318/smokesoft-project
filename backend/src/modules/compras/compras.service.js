const pool = require('../../config/db');
const productosService = require('../productos/productos.service');

async function obtenerTodas() {
  const result = await pool.query(
    `SELECT c.*, p.nombre AS nombre_proveedor
     FROM compra c
     LEFT JOIN proveedor p ON p.id_proveedor = c.id_proveedor
     ORDER BY c.fecha DESC, c.id_compra DESC`
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const compra = await pool.query('SELECT * FROM compra WHERE id_compra = $1', [id]);
  if (!compra.rows[0]) return null;

  const detalle = await pool.query(
    `SELECT d.*, pr.nombre AS nombre_producto
     FROM detalle_compra d
     JOIN producto pr ON pr.id_producto = d.id_producto
     WHERE d.id_compra = $1`,
    [id]
  );

  return { ...compra.rows[0], detalle: detalle.rows };
}

async function crear({ id_proveedor, id_usuario, productos }) {
  if (!productos || productos.length === 0) {
    throw { status: 400, message: 'La compra debe tener al menos un producto' };
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    // 1. Calculamos el total en el servidor (nunca confiamos en un total mandado por el cliente)
    const total = productos.reduce(
      (suma, p) => suma + p.cantidad * p.precio_unitario,
      0
    );

    // 2. Creamos el encabezado de la compra
    const resultCompra = await cliente.query(
      `INSERT INTO compra (id_proveedor, id_usuario, total)
       VALUES ($1, $2, $3) RETURNING *`,
      [id_proveedor, id_usuario, total]
    );
    const compra = resultCompra.rows[0];

    // 3. Por cada producto: insertamos el detalle y subimos el stock
    for (const item of productos) {
      const subtotal = item.cantidad * item.precio_unitario;

      await cliente.query(
        `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, subtotal)
         VALUES ($1, $2, $3, $4)`,
        [compra.id_compra, item.id_producto, item.cantidad, subtotal]
      );

      // Reutilizamos la función que ya existía en productos.service.js,
      // pasándole `cliente` para que la actualización sea parte de esta misma transacción
      await productosService.actualizarStock(item.id_producto, item.cantidad, cliente);
    }

    await cliente.query('COMMIT');
    return compra;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { obtenerTodas, obtenerPorId, crear };