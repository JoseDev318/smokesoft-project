const { Router } = require('express');
const categoriasController = require('./categorias.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken);

router.get('/', categoriasController.listar);
router.get('/:id', categoriasController.obtener);
router.post('/', verificarRol('Administrador', 'Inventario'), categoriasController.crear);
router.put('/:id', verificarRol('Administrador', 'Inventario'), categoriasController.actualizar);
router.delete('/:id', verificarRol('Administrador'), categoriasController.eliminar);

module.exports = router;