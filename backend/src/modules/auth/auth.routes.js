const { Router } = require('express');
const authController = require('./auth.controller');

const router = Router();

// POST /api/auth/login  { "usuario": "admin", "clave": "12345678" }
router.post('/login', authController.login);

module.exports = router;
