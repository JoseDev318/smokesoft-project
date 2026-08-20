const { Router } = require('express');
const productosController = require('./productos.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarTokenOpcional = require('../../middlewares/auth.optional.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId } = require('../../utils/peticiones');

const router = Router();

// Ya NO hay router.use(verificarToken): el catálogo es público para que la
// tienda se pueda navegar sin iniciar sesión. Las escrituras siguen protegidas.

// --- Lectura pública ---
// verificarTokenOpcional no bloquea a un anónimo, pero si vienes logueado deja
// req.usuario disponible para que el controlador decida si puedes ver inactivos.
router.get('/', verificarTokenOpcional, productosController.listar);

// --- Lectura privada ---
// OJO: '/stock-bajo' y '/resumen' son literales de un segmento y colisionan con
// '/:id'. DEBEN declararse antes, o Express matchea '/:id' y Postgres lanza
// `invalid input syntax for type integer: "stock-bajo"`.
router.get('/stock-bajo', verificarToken, verificarRol('Administrador', 'Inventario'), productosController.stockBajo);
router.get('/resumen', verificarToken, verificarRol('Administrador', 'Inventario'), productosController.resumen);

// Público, pero un producto inactivo solo lo ve el personal de inventario.
router.get('/:id', verificarTokenOpcional, conId(productosController.obtener));

// --- Escritura: solo Administrador e Inventario ---
router.post('/', verificarToken, verificarRol('Administrador', 'Inventario'), productosController.crear);
router.patch('/:id/stock', verificarToken, verificarRol('Administrador', 'Inventario'), conId(productosController.ajustarStock));
router.patch('/:id/estado', verificarToken, verificarRol('Administrador', 'Inventario'), conId(productosController.cambiarEstado));
router.put('/:id', verificarToken, verificarRol('Administrador', 'Inventario'), conId(productosController.actualizar));
router.delete('/:id', verificarToken, verificarRol('Administrador'), conId(productosController.eliminar));

module.exports = router;
