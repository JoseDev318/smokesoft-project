const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

async function obtenerTodos() {
  const result = await pool.query(
    'SELECT id_usuario, nombre, usuario, correo, rol, estado FROM usuario ORDER BY id_usuario'
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query(
    'SELECT id_usuario, nombre, usuario, correo, rol, estado FROM usuario WHERE id_usuario = $1',
    [id]
  );
  return result.rows[0];
}

async function crear({ nombre, usuario, correo, clave, rol }) {
  const claveHash = await bcrypt.hash(clave, 10);
  const result = await pool.query(
    `INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id_usuario, nombre, usuario, correo, rol, estado`,
    [nombre, usuario, correo, claveHash, rol]
  );
  return result.rows[0];
}

async function actualizar(id, { nombre, correo, rol }) {
  const result = await pool.query(
    `UPDATE usuario SET nombre = $1, correo = $2, rol = $3
     WHERE id_usuario = $4
     RETURNING id_usuario, nombre, usuario, correo, rol, estado`,
    [nombre, correo, rol, id]
  );
  return result.rows[0];
}

async function cambiarEstado(id, estado) {
  const result = await pool.query(
    `UPDATE usuario SET estado = $1 WHERE id_usuario = $2
     RETURNING id_usuario, nombre, usuario, correo, rol, estado`,
    [estado, id]
  );
  return result.rows[0];
}

async function eliminar(id) {
  await pool.query('DELETE FROM usuario WHERE id_usuario = $1', [id]);
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, cambiarEstado, eliminar };