// Helpers compartidos por los controladores.

const ROLES_INVENTARIO = ['Administrador', 'Inventario'];
const ROLES_VENTAS = ['Administrador', 'Vendedor'];
const ROLES_STAFF = ['Administrador', 'Inventario', 'Vendedor'];

/**
 * Los `:id` de las rutas van directo a Postgres como entero. Sin esta guarda,
 * `GET /api/productos/abc` produce `invalid input syntax for type integer` y el
 * manejador central lo devuelve como un 500 con el mensaje crudo de Postgres.
 * En una ruta pública eso es un 500 disparable por cualquiera que además filtra
 * detalles internos.
 *
 * Devuelve el id como número, o null si no es válido.
 */
function idNumerico(valor) {
  return /^\d+$/.test(String(valor)) ? Number(valor) : null;
}

/**
 * Envuelve un handler para validar `req.params.id` antes de ejecutarlo.
 * Deja el id parseado en `req.idParam`.
 */
function conId(handler) {
  return (req, res, next) => {
    const id = idNumerico(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Id inválido' });
    req.idParam = id;
    return handler(req, res, next);
  };
}

function tieneRol(usuario, roles) {
  return !!usuario && roles.includes(usuario.rol);
}

module.exports = {
  idNumerico, conId, tieneRol,
  ROLES_INVENTARIO, ROLES_VENTAS, ROLES_STAFF,
};
