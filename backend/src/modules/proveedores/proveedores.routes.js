const { Router } = require('express');
const proveedoresController = require('./proveedores.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken);

router.get('/', proveedoresController.listar);
router.get('/:id', proveedoresController.obtener);
router.post('/', verificarRol('Administrador', 'Inventario'), proveedoresController.crear);
router.put('/:id', verificarRol('Administrador', 'Inventario'), proveedoresController.actualizar);
router.delete('/:id', verificarRol('Administrador'), proveedoresController.eliminar);

module.exports = router;