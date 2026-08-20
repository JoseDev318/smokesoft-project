const { Router } = require('express');
const usuariosController = require('./usuarios.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId } = require('../../utils/peticiones');

const router = Router();

// Todas las rutas de este módulo requieren estar logueado...
router.use(verificarToken);

// ...y además, solo el Administrador puede gestionar usuarios.
router.get('/', verificarRol('Administrador'), usuariosController.listar);
router.get('/:id', verificarRol('Administrador'), conId(usuariosController.obtener));
router.post('/', verificarRol('Administrador'), usuariosController.crear);
router.put('/:id', verificarRol('Administrador'), conId(usuariosController.actualizar));
router.patch('/:id/estado', verificarRol('Administrador'), conId(usuariosController.cambiarEstado));
router.delete('/:id', verificarRol('Administrador'), conId(usuariosController.eliminar));

module.exports = router;
