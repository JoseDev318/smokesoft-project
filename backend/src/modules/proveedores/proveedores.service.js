const pool = require('../../config/db');
const { conErroresLegibles } = require('../../utils/errores');

async function obtenerTodos() {
  const result = await pool.query('SELECT * FROM proveedor ORDER BY id_proveedor');
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query('SELECT * FROM proveedor WHERE id_proveedor = $1', [id]);
  return result.rows[0];
}

async function crear({ nombre, telefono, direccion, correo }) {
  const result = await pool.query(
    'INSERT INTO proveedor (nombre, telefono, direccion, correo) VALUES ($1, $2, $3, $4) RETURNING *',
    [nombre, telefono, direccion, correo]
  );
  return result.rows[0];
}

async function actualizar(id, { nombre, telefono, direccion, correo }) {
  const result = await pool.query(
    'UPDATE proveedor SET nombre=$1, telefono=$2, direccion=$3, correo=$4 WHERE id_proveedor=$5 RETURNING *',
    [nombre, telefono, direccion, correo, id]
  );
  return result.rows[0];
}

async function eliminar(id) {
  await conErroresLegibles(
    () => pool.query('DELETE FROM proveedor WHERE id_proveedor = $1', [id]),
    { llaveForanea: 'No se puede eliminar el proveedor porque tiene productos o compras asociadas' }
  );
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };