const jwt = require('jsonwebtoken');

// Variante permisiva de auth.middleware para rutas PÚBLICAS que igual quieren
// saber quién eres si vienes logueado (ej: el catálogo, que a un Administrador
// le deja pedir también los productos inactivos).
//
// La diferencia clave con verificarToken: si el token falta, viene mal formado
// o está EXPIRADO, aquí se continúa igual con req.usuario sin definir.
// verificarToken responde 403 a un token expirado, y un catálogo público no
// puede romperse porque el visitante tenga un token viejo en el navegador.

function verificarTokenOpcional(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Token inválido o expirado: se trata como visitante anónimo, no como error.
  }

  next();
}

module.exports = verificarTokenOpcional;
