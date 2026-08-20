const pool = require('../../config/db');
const { conErroresLegibles } = require('../../utils/errores');

async function obtenerTodas() {
  const result = await pool.query('SELECT * FROM categoria ORDER BY id_categoria');
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query('SELECT * FROM categoria WHERE id_categoria = $1', [id]);
  return result.rows[0];
}

async function crear({ nombre, descripcion }) {
  const result = await pool.query(
    'INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING *',
    [nombre, descripcion]
  );
  return result.rows[0];
}

async function actualizar(id, { nombre, descripcion }) {
  const result = await pool.query(
    'UPDATE categoria SET nombre = $1, descripcion = $2 WHERE id_categoria = $3 RETURNING *',
    [nombre, descripcion, id]
  );
  return result.rows[0];
}

async function eliminar(id) {
  await conErroresLegibles(
    () => pool.query('DELETE FROM categoria WHERE id_categoria = $1', [id]),
    { llaveForanea: 'No se puede eliminar la categoría porque tiene productos asociados' }
  );
}

module.exports = { obtenerTodas, obtenerPorId, crear, actualizar, eliminar };