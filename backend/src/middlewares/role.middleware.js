// Middleware "de fábrica": recibe los roles permitidos y devuelve el middleware real.
// Uso en una ruta: verificarRol('Administrador')  o  verificarRol('Administrador', 'Vendedor')
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }
    next();
  };
}

module.exports = verificarRol;
