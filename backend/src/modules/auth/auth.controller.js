const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { usuario, clave } = req.body;
    if (!usuario || !clave) {
      return res.status(400).json({ error: 'Usuario y clave son obligatorios' });
    }
    const resultado = await authService.login(usuario, clave);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

// Registro público de un cliente de la tienda. Devuelve un token para que el
// visitante quede logueado sin pasar por la pantalla de ingreso.
async function registro(req, res, next) {
  try {
    const resultado = await authService.registrarCliente(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function yo(req, res, next) {
  try {
    const usuario = await authService.obtenerSesion(req.usuario.id);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, registro, yo };
