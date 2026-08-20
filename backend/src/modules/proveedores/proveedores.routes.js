const { Router } = require('express');
const proveedoresController = require('./proveedores.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId, ROLES_STAFF } = require('../../utils/peticiones');

const router = Router();
router.use(verificarToken);

// Los GET antes solo tenían verificarToken, sin verificarRol: autenticaban pero
// no autorizaban. Con el rol 'Cliente' en juego, eso dejaba a cualquier
// comprador leer el nombre, correo, teléfono y dirección de todos los
// proveedores. Los datos de proveedor son solo para el personal.
router.get('/', verificarRol(...ROLES_STAFF), proveedoresController.listar);
router.get('/:id', verificarRol(...ROLES_STAFF), conId(proveedoresController.obtener));

router.post('/', verificarRol('Administrador', 'Inventario'), proveedoresController.crear);
router.put('/:id', verificarRol('Administrador', 'Inventario'), conId(proveedoresController.actualizar));
router.delete('/:id', verificarRol('Administrador'), conId(proveedoresController.eliminar));

module.exports = router;
