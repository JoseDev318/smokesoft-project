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

module.exports = { login };