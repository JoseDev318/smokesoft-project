const pool = require('../../config/db');

async function obtenerTodos({ incluirInactivos = false } = {}) {
  const query = incluirInactivos
    ? 'SELECT * FROM producto ORDER BY id_producto'
    : 'SELECT * FROM producto WHERE activo = true ORDER BY id_producto';
  const result = await pool.query(query);
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [id]);
  return result.rows[0];
}

async function crear({ nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor }) {
  const result = await pool.query(
    `INSERT INTO producto (nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
    [nombre, descripcion, precio, stock || 0, stock_minimo || 0, id_categoria, id_proveedor]
  );
  return result.rows[0];
}

async function actualizar(id, { nombre, descripcion, precio, stock_minimo, id_categoria, id_proveedor }) {
  const result = await pool.query(
    `UPDATE producto SET nombre=$1, descripcion=$2, precio=$3, stock_minimo=$4, id_categoria=$5, id_proveedor=$6
     WHERE id_producto=$7 RETURNING *`,
    [nombre, descripcion, precio, stock_minimo, id_categoria, id_proveedor, id]
  );
  return result.rows[0];
}

async function cambiarEstado(id, activo) {
  const result = await pool.query(
    'UPDATE producto SET activo = $1 WHERE id_producto = $2 RETURNING *',
    [activo, id]
  );
  return result.rows[0];
}

// cantidad positiva = entrada (compra), negativa = salida (venta)
async function actualizarStock(id, cantidad, clienteDB = pool) {
  const result = await clienteDB.query(
    'UPDATE producto SET stock = stock + $1 WHERE id_producto = $2 RETURNING *',
    [cantidad, id]
  );
  return result.rows[0];
}

async function obtenerStockBajo() {
  const result = await pool.query(
    'SELECT * FROM producto WHERE stock <= stock_minimo AND activo = true ORDER BY stock ASC'
  );
  return result.rows;
}

async function eliminar(id) {
  await pool.query('DELETE FROM producto WHERE id_producto = $1', [id]);
}

module.exports = {
  obtenerTodos, obtenerPorId, crear, actualizar,
  cambiarEstado, actualizarStock, obtenerStockBajo, eliminar,
};