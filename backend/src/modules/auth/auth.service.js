const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

// El rol de las cuentas creadas desde la tienda. Es una constante del servicio,
// nunca un valor que venga de la petición.
const ROL_CLIENTE = 'Cliente';

function firmarToken(usuario) {
  const payload = {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    rol: usuario.rol,
    // Permite que /api/ventas/mias y /api/clientes/mio resuelvan la ficha del
    // comprador sin una consulta extra. Es null para el personal.
    id_cliente: usuario.id_cliente || null,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return { token, usuario: payload };
}

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

  return firmarToken(usuarioEncontrado);
}

/**
 * Registro público de un cliente de la tienda.
 *
 * Crea la ficha en `cliente` y la cuenta en `usuario` en una sola transacción,
 * y devuelve un token para que el visitante quede logueado de inmediato.
 */
async function registrarCliente(datos) {
  const {
    nombre, apellidos, correo, usuario, clave,
    tipo_documento, documento, celular, telefono, direccion,
  } = datos;

  // Validación explícita: el resto del backend no tiene capa de validación, y
  // este es el único endpoint público de escritura.
  if (!nombre || !usuario || !clave) {
    throw { status: 400, message: 'Nombre, usuario y contraseña son obligatorios' };
  }
  if (String(clave).length < 8) {
    throw { status: 400, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  // El guía pide nombre y apellidos por separado, pero `cliente.nombre` es el
  // "Nombre Completo" del propio CRUD del panel: se unen para que las dos vías
  // de creación guarden lo mismo.
  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();
  const telefonoCliente = celular || telefono || null;
  const claveHash = await bcrypt.hash(clave, 10);

  const clienteDB = await pool.connect();

  try {
    await clienteDB.query('BEGIN');

    const { rows: [cliente] } = await clienteDB.query(
      `INSERT INTO cliente (nombre, correo, telefono, direccion, tipo_documento, documento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_cliente, nombre`,
      [nombreCompleto, correo || null, telefonoCliente, direccion || null,
       tipo_documento || null, documento || null]
    );

    // `rol` se escribe literal: cualquier "rol" que venga en el body se ignora.
    // Esta línea es la frontera de escalación de privilegios de todo el registro.
    const { rows: [cuenta] } = await clienteDB.query(
      `INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado, id_cliente)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING id_usuario, nombre, rol, id_cliente`,
      [nombreCompleto, usuario, correo || null, claveHash, ROL_CLIENTE, cliente.id_cliente]
    );

    await clienteDB.query('COMMIT');
    return firmarToken(cuenta);
  } catch (error) {
    try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexión ya perdida */ }

    // Mensaje distinto por campo: es el único endpoint público de escritura, y
    // dejar salir el nombre crudo de la restricción filtraría el esquema.
    throw mapearErrorRegistro(error);
  } finally {
    clienteDB.release();
  }
}

function mapearErrorRegistro(error) {
  if (error && error.code === '23505') {
    const restriccion = error.constraint || '';
    if (restriccion.includes('usuario_usuario')) {
      return { status: 409, message: 'Ese nombre de usuario ya está registrado' };
    }
    if (restriccion.includes('documento')) {
      return { status: 409, message: 'Ya existe una cuenta con ese documento' };
    }
    if (restriccion.includes('correo')) {
      return { status: 409, message: 'Ese correo ya está registrado' };
    }
    return { status: 409, message: 'Algunos de tus datos ya están registrados' };
  }
  return error;
}

/**
 * Datos del usuario autenticado. Relee la base de datos a propósito: así se
 * detecta una cuenta deshabilitada o borrada a mitad de la vida del token.
 *
 * Responde 401 (no 403) cuando la sesión ya no vale, para que el frontend sepa
 * que debe descartar el token en lugar de mostrar un error de permisos.
 */
async function obtenerSesion(idUsuario) {
  const result = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.usuario, u.correo, u.rol, u.estado, u.id_cliente,
            c.nombre    AS cliente_nombre,
            c.telefono  AS cliente_telefono,
            c.direccion AS cliente_direccion,
            c.documento AS cliente_documento
       FROM usuario u
       LEFT JOIN cliente c ON c.id_cliente = u.id_cliente
      WHERE u.id_usuario = $1`,
    [idUsuario]
  );

  const usuario = result.rows[0];
  if (!usuario) throw { status: 401, message: 'La sesión ya no es válida' };
  if (!usuario.estado) throw { status: 401, message: 'Tu cuenta está deshabilitada' };

  return usuario;
}

module.exports = { login, registrarCliente, obtenerSesion, ROL_CLIENTE };
