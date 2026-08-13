const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

async function login(usuario, clave) {
  const result = await pool.query(
    'SELECT * FROM usuario WHERE usuario = $1 AND estado = true',
    [usuario]
  );

  const usuarioEncontrado = result.rows[0];
  if (!usuarioEncontrado) {
    throw { status: 401, message: 'Usuario o contraseña incorrectos' };
  }

  // Comparamos la clave que envían con el hash guardado (nunca se guarda la clave en texto plano)
  const claveValida = await bcrypt.compare(clave, usuarioEncontrado.clave);
  if (!claveValida) {
    throw { status: 401, message: 'Usuario o contraseña incorrectos' };
  }

  const payload = {
    id: usuarioEncontrado.id_usuario,
    nombre: usuarioEncontrado.nombre,
    rol: usuarioEncontrado.rol,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return { token, usuario: payload };
}

module.exports = { login };