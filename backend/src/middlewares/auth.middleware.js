const jwt = require('jsonwebtoken');

// Este middleware se ejecuta antes de llegar al controlador de una ruta protegida.
// Revisa que venga un token válido en el header "Authorization: Bearer <token>".

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

    try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // Queda disponible en el resto de la petición: req.usuario.id, req.usuario.rol...
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = verificarToken;
