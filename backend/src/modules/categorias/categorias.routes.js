const { Router } = require('express');
const categoriasController = require('./categorias.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId } = require('../../utils/peticiones');

const router = Router();

// Sin router.use(verificarToken): el catálogo público necesita las categorías
// para filtrar productos. `categoria` no tiene columnas sensibles ni un flag
// de activo, así que la lectura es abierta sin matices.
router.get('/', categoriasController.listar);
router.get('/:id', conId(categoriasController.obtener));

// Escritura protegida.
router.post('/', verificarToken, verificarRol('Administrador', 'Inventario'), categoriasController.crear);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Inventario'), conId(categoriasController.actualizar));
router.delete('/:id', verificarToken, verificarRol('Administrador'), conId(categoriasController.eliminar));

module.exports = router;
