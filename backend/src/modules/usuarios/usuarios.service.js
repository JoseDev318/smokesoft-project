const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { conErroresLegibles } = require('../../utils/errores');

// Roles que se administran desde el panel. 'Cliente' NO está aquí: esas cuentas
// se crean solas desde /api/auth/registro y se gestionan como clientes.
const ROLES_ASIGNABLES = ['Administrador', 'Inventario', 'Vendedor'];

const COLUMNAS = 'id_usuario, nombre, usuario, correo, rol, estado';

const MENSAJES = {
  unico: (restriccion) =>
    restriccion.includes('correo')
      ? 'Ese correo ya está registrado'
      : 'Ese nombre de usuario ya está registrado',
  llaveForanea: 'No se puede eliminar el usuario porque tiene ventas o compras registradas',
};

function validarRol(rol) {
  if (!ROLES_ASIGNABLES.includes(rol)) {
    throw {
      status: 400,
      message: `El rol debe ser uno de: ${ROLES_ASIGNABLES.join(', ')}`,
    };
  }
}

// Por defecto se excluyen las cuentas de tienda (rol='Cliente'): son filas en
// `usuario` igual que el personal, y sin este filtro inundarían la grilla de
// usuarios del panel. Se piden con ?incluirClientes=true si hace falta.
async function obtenerTodos({ incluirClientes = false } = {}) {
  const query = incluirClientes
    ? `SELECT ${COLUMNAS} FROM usuario ORDER BY id_usuario`
    : `SELECT ${COLUMNAS} FROM usuario WHERE rol <> 'Cliente' ORDER BY id_usuario`;
  const result = await pool.query(query);
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query(
    `SELECT ${COLUMNAS} FROM usuario WHERE id_usuario = $1`,
    [id]
  );
  return result.rows[0];
}

async function crear({ nombre, usuario, correo, clave, rol }) {
  if (!nombre || !usuario || !clave) {
    throw { status: 400, message: 'Nombre, usuario y clave son obligatorios' };
  }
  if (String(clave).length < 8) {
    throw { status: 400, message: 'La clave debe tener al menos 8 caracteres' };
  }
  validarRol(rol);

  const claveHash = await bcrypt.hash(clave, 10);
  return conErroresLegibles(async () => {
    const result = await pool.query(
      `INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING ${COLUMNAS}`,
      [nombre, usuario, correo, claveHash, rol]
    );
    return result.rows[0];
  }, MENSAJES);
}

// PUT es reemplazo total: los tres campos son obligatorios o se escribiría NULL.
// `usuario` y `clave` no se tocan aquí a propósito.
async function actualizar(id, { nombre, correo, rol }) {
  if (!nombre) throw { status: 400, message: 'El nombre es obligatorio' };
  validarRol(rol);

  return conErroresLegibles(async () => {
    const result = await pool.query(
      `UPDATE usuario SET nombre = $1, correo = $2, rol = $3
       WHERE id_usuario = $4 AND rol <> 'Cliente'
       RETURNING ${COLUMNAS}`,
      [nombre, correo, rol, id]
    );
    return result.rows[0];
  }, MENSAJES);
}

async function cambiarEstado(id, estado) {
  const result = await pool.query(
    `UPDATE usuario SET estado = $1 WHERE id_usuario = $2
     RETURNING ${COLUMNAS}`,
    [estado, id]
  );
  return result.rows[0];
}

async function eliminar(id) {
  await conErroresLegibles(
    () => pool.query('DELETE FROM usuario WHERE id_usuario = $1', [id]),
    MENSAJES
  );
}

module.exports = {
  obtenerTodos, obtenerPorId, crear, actualizar, cambiarEstado, eliminar,
  ROLES_ASIGNABLES,
};
