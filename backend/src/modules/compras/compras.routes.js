const { Router } = require('express');
const comprasController = require('./compras.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken);

router.get('/', comprasController.listar);
router.get('/:id', comprasController.obtener);
router.post('/', verificarRol('Administrador', 'Inventario'), comprasController.crear);

module.exports = router;