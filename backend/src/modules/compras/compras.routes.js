const { Router } = require('express');
const comprasController = require('./compras.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId, ROLES_INVENTARIO } = require('../../utils/peticiones');

const router = Router();
router.use(verificarToken);

// Compras a PROVEEDOR (entrada de mercancía). No confundir con el módulo
// "Compras" del proyecto guía, que en realidad son ventas a clientes.

// '/estadisticas' es un literal de un segmento: debe ir antes de '/:id'.
router.get('/estadisticas', verificarRol(...ROLES_INVENTARIO), comprasController.estadisticas);

router.get('/', verificarRol(...ROLES_INVENTARIO), comprasController.listar);
router.get('/:id', verificarRol(...ROLES_INVENTARIO), conId(comprasController.obtener));
router.post('/', verificarRol(...ROLES_INVENTARIO), comprasController.crear);
router.delete('/:id', verificarRol('Administrador'), conId(comprasController.eliminar));

module.exports = router;
