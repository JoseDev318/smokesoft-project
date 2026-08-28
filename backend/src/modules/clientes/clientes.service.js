const pool = require('../../config/db');

async function obtenerTodos({ busqueda } = {}) {
  if (busqueda) {
    const result = await pool.query(
      `SELECT * FROM cliente
       WHERE nombre ILIKE $1 OR correo ILIKE $1
       ORDER BY nombre`,
      [`%${busqueda}%`]
    );
    return result.rows;
  }

  const result = await pool.query('SELECT * FROM cliente ORDER BY nombre');
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query('SELECT * FROM cliente WHERE id_cliente = $1', [id]);
  return result.rows[0];
}

async function crear({ nombre, correo, telefono, direccion }) {
  const result = await pool.query(
    `INSERT INTO cliente (nombre, correo, telefono, direccion)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, correo || null, telefono || null, direccion || null]
  );
  return result.rows[0];
}

async function actualizar(id, { nombre, correo, telefono, direccion }) {
  const result = await pool.query(
    `UPDATE cliente SET nombre = $1, correo = $2, telefono = $3, direccion = $4
     WHERE id_cliente = $5 RETURNING *`,
    [nombre, correo || null, telefono || null, direccion || null, id]
  );
  return result.rows[0];
}

async function eliminar(id) {
  await pool.query('DELETE FROM cliente WHERE id_cliente = $1', [id]);
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };