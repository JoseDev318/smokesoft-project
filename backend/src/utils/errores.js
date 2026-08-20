// Traduce los errores de PostgreSQL a los objetos { status, message } que espera
// el manejador central de app.js. Sin esto, un correo duplicado sale como un 500
// con el texto crudo de Postgres, que además filtra nombres de restricciones.

const CODIGOS = {
  UNICO: '23505',       // unique_violation
  LLAVE_FORANEA: '23503', // foreign_key_violation
  NO_NULO: '23502',     // not_null_violation
};

/**
 * @param {Error}  error      el error que lanzó `pg`
 * @param {object} mensajes   { unico, llaveForanea } mensajes específicos del módulo.
 *                            `unico` puede ser una función que recibe el nombre
 *                            de la restricción, para distinguir campo por campo.
 */
function mapearErrorPg(error, mensajes = {}) {
  if (!error || !error.code) return error;

  if (error.code === CODIGOS.UNICO) {
    const restriccion = error.constraint || '';
    const mensaje = typeof mensajes.unico === 'function'
      ? mensajes.unico(restriccion)
      : mensajes.unico;
    return { status: 409, message: mensaje || 'Ya existe un registro con ese valor' };
  }

  if (error.code === CODIGOS.LLAVE_FORANEA) {
    return {
      status: 409,
      message: mensajes.llaveForanea || 'No se puede completar la operación porque hay registros relacionados',
    };
  }

  if (error.code === CODIGOS.NO_NULO) {
    return { status: 400, message: `El campo "${error.column}" es obligatorio` };
  }

  return error;
}

/** Ejecuta `fn` y reemplaza los errores de Postgres por versiones legibles. */
async function conErroresLegibles(fn, mensajes) {
  try {
    return await fn();
  } catch (error) {
    throw mapearErrorPg(error, mensajes);
  }
}

module.exports = { mapearErrorPg, conErroresLegibles, CODIGOS };
