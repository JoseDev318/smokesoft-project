const { Router } = require('express');
const productosController = require('./productos.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');

const router = Router();

router.use(verificarToken);

// Consultar: cualquier rol autenticado lo necesita (para vender, comprar, revisar inventario)
router.get('/', productosController.listar);
router.get('/stock-bajo', productosController.stockBajo);
router.get('/:id', productosController.obtener);

// Modificar: solo Administrador e Inventario
router.post('/', verificarRol('Administrador', 'Inventario'), productosController.crear);
router.put('/:id', verificarRol('Administrador', 'Inventario'), productosController.actualizar);
router.patch('/:id/estado', verificarRol('Administrador', 'Inventario'), productosController.cambiarEstado);
router.delete('/:id', verificarRol('Administrador'), productosController.eliminar);

module.exports = router;