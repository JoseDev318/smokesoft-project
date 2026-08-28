const { Router } = require('express');
const clientesController = require('./clientes.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken);

router.get('/', clientesController.listar);
router.get('/:id', clientesController.obtener);
router.post('/', verificarRol('Administrador', 'Vendedor'), clientesController.crear);
router.put('/:id', verificarRol('Administrador', 'Vendedor'), clientesController.actualizar);
router.delete('/:id', verificarRol('Administrador'), clientesController.eliminar);

module.exports = router;