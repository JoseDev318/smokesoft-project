const pool = require('../../config/db');
const { conErroresLegibles } = require('../../utils/errores');

const MENSAJES = {
  llaveForanea: 'La categoría o el proveedor indicado no existe',
};

async function obtenerTodos({ incluirInactivos = false } = {}) {
  const query = incluirInactivos
    ? 'SELECT * FROM producto ORDER BY id_producto'
    : 'SELECT * FROM producto WHERE activo = true ORDER BY id_producto';
  const result = await pool.query(query);
  return result.rows;
}

// `incluirInactivos` lo decide el controlador según el rol: un visitante anónimo
// no debe ver un producto desactivado (recibe 404).
async function obtenerPorId(id, { incluirInactivos = true } = {}) {
  const query = incluirInactivos
    ? 'SELECT * FROM producto WHERE id_producto = $1'
    : 'SELECT * FROM producto WHERE id_producto = $1 AND activo = true';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function crear({ nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, imagen }) {
  return conErroresLegibles(async () => {
    const result = await pool.query(
      `INSERT INTO producto (nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, imagen, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [nombre, descripcion, precio, stock || 0, stock_minimo || 0, id_categoria, id_proveedor, imagen]
    );
    return result.rows[0];
  }, MENSAJES);
}

// OJO: `stock` no se actualiza aquí a propósito. Se mueve por ajustarStock() o
// por una venta/compra, para que un guardado del formulario no lo pise.
async function actualizar(id, { nombre, descripcion, precio, stock_minimo, id_categoria, id_proveedor, imagen }) {
  return conErroresLegibles(async () => {
    const result = await pool.query(
      `UPDATE producto SET nombre=$1, descripcion=$2, precio=$3, stock_minimo=$4,
              id_categoria=$5, id_proveedor=$6, imagen=$7
       WHERE id_producto=$8 RETURNING *`,
      [nombre, descripcion, precio, stock_minimo, id_categoria, id_proveedor, imagen, id]
    );
    return result.rows[0];
  }, MENSAJES);
}

async function cambiarEstado(id, activo) {
  const result = await pool.query(
    'UPDATE producto SET activo = $1 WHERE id_producto = $2 RETURNING *',
    [activo, id]
  );
  return result.rows[0];
}

// cantidad positiva = entrada (compra), negativa = salida (venta).
// El `stock + $1 >= 0` impide dejar stock negativo incluso en una carrera entre
// dos ventas simultáneas.
//
// CONTRATO: devuelve undefined si el producto no existe O si el ajuste dejaría
// el stock en negativo. Todo llamador debe tratar el valor falsy como fallo.
async function actualizarStock(id, cantidad, clienteDB = pool) {
  const result = await clienteDB.query(
    `UPDATE producto SET stock = stock + $1
      WHERE id_producto = $2 AND stock + $1 >= 0
      RETURNING *`,
    [cantidad, id]
  );
  return result.rows[0];
}

// Ajuste manual de inventario. `cantidad` es un delta con signo.
async function ajustarStock(id, cantidad) {
  const delta = Number(cantidad);
  if (!Number.isInteger(delta) || delta === 0) {
    throw { status: 400, message: 'La cantidad debe ser un número entero distinto de cero' };
  }

  const producto = await actualizarStock(id, delta);
  if (!producto) {
    throw {
      status: 409,
      message: 'El producto no existe o el ajuste dejaría el stock en negativo',
    };
  }
  return producto;
}

async function obtenerStockBajo() {
  const result = await pool.query(
    'SELECT * FROM producto WHERE stock <= stock_minimo AND activo = true ORDER BY stock ASC'
  );
  return result.rows;
}

// Agregados para los tiles del dashboard, sin mandar la tabla entera al navegador.
async function obtenerResumen() {
  const result = await pool.query(`
    SELECT COUNT(*)::int                                              AS total,
           COUNT(*) FILTER (WHERE activo)::int                        AS activos,
           COALESCE(SUM(stock), 0)::int                               AS existencias,
           COUNT(*) FILTER (WHERE activo AND stock <= stock_minimo)::int AS stock_bajo
      FROM producto
  `);
  return result.rows[0];
}

async function eliminar(id) {
  await conErroresLegibles(
    () => pool.query('DELETE FROM producto WHERE id_producto = $1', [id]),
    { llaveForanea: 'No se puede eliminar el producto porque tiene ventas o compras registradas' }
  );
}

module.exports = {
  obtenerTodos, obtenerPorId, crear, actualizar, cambiarEstado,
  actualizarStock, ajustarStock, obtenerStockBajo, obtenerResumen, eliminar,
};
