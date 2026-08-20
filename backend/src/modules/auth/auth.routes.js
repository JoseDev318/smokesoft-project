const { Router } = require('express');
const authController = require('./auth.controller');
const verificarToken = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/auth/login  { "usuario": "admin", "clave": "admin123" }
router.post('/login', authController.login);

// POST /api/auth/registro — público: alta de cliente desde la tienda.
// El rol se fuerza a 'Cliente' en el servicio, nunca se lee del body.
router.post('/registro', authController.registro);

// GET /api/auth/me — datos del usuario autenticado, releídos de la base de
// datos para detectar cuentas deshabilitadas a mitad de la vida del token.
router.get('/me', verificarToken, authController.yo);

module.exports = router;
