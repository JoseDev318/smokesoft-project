const pool = require('../../config/db');
const { conErroresLegibles } = require('../../utils/errores');

const MENSAJES = {
  unico: (restriccion) =>
    restriccion.includes('documento')
      ? 'Ya existe un cliente con ese documento'
      : 'Ya existe un cliente con ese correo',
  // `venta.id_cliente` y `usuario.id_cliente` apuntan aquí, así que el conflicto
  // puede venir de un historial de compras o de una cuenta de tienda.
  llaveForanea: 'No se puede eliminar el cliente porque tiene ventas registradas o una cuenta asociada',
};

function validarNombre(nombre) {
  if (!nombre || !String(nombre).trim()) {
    throw { status: 400, message: 'El nombre del cliente es obligatorio' };
  }
}

async function obtenerTodos() {
  const result = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query('SELECT * FROM cliente WHERE id_cliente = $1', [id]);
  return result.rows[0];
}

async function crear({ nombre, correo, telefono, direccion, tipo_documento, documento }, clienteDB = pool) {
  validarNombre(nombre);
  return conErroresLegibles(async () => {
    const result = await clienteDB.query(
      `INSERT INTO cliente (nombre, correo, telefono, direccion, tipo_documento, documento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre, correo || null, telefono || null, direccion || null, tipo_documento || null, documento || null]
    );
    return result.rows[0];
  }, MENSAJES);
}

// PUT es reemplazo total: lo que no se envíe queda en NULL.
async function actualizar(id, { nombre, correo, telefono, direccion, tipo_documento, documento }) {
  validarNombre(nombre);
  return conErroresLegibles(async () => {
    const result = await pool.query(
      `UPDATE cliente SET nombre=$1, correo=$2, telefono=$3, direccion=$4,
              tipo_documento=$5, documento=$6
       WHERE id_cliente=$7 RETURNING *`,
      [nombre, correo || null, telefono || null, direccion || null,
       tipo_documento || null, documento || null, id]
    );
    return result.rows[0];
  }, MENSAJES);
}

// Historial de compras de un cliente. `fecha::text` evita que `pg` la convierta
// a Date y JSON la serialice como timestamp UTC, que en UTC-5 muestra el día
// anterior.
async function obtenerVentas(idCliente) {
  const result = await pool.query(
    `SELECT id_venta, id_cliente, id_usuario, fecha::text AS fecha,
            subtotal, iva, total, notas
       FROM venta
      WHERE id_cliente = $1
      ORDER BY id_venta DESC`,
    [idCliente]
  );
  return result.rows;
}

async function eliminar(id) {
  await conErroresLegibles(
    () => pool.query('DELETE FROM cliente WHERE id_cliente = $1', [id]),
    MENSAJES
  );
}

// Fallback para tokens emitidos antes de que el payload incluyera id_cliente:
// siguen validando contra el mismo secreto, pero sin el claim.
async function obtenerIdClientePorUsuario(idUsuario) {
  const result = await pool.query(
    'SELECT id_cliente FROM usuario WHERE id_usuario = $1',
    [idUsuario]
  );
  return result.rows[0] ? result.rows[0].id_cliente : null;
}

module.exports = {
  obtenerTodos, obtenerPorId, crear, actualizar, obtenerVentas, eliminar,
  obtenerIdClientePorUsuario,
};
