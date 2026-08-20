const { Router } = require('express');
const ventasController = require('./ventas.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId, ROLES_VENTAS } = require('../../utils/peticiones');

const router = Router();
router.use(verificarToken);

// OJO: '/estadisticas', '/recientes', '/por-cliente' y '/mias' son literales de
// un segmento y colisionan con '/:id'. TODOS deben declararse antes, o Express
// matchea '/:id' y Postgres lanza
// `invalid input syntax for type integer: "estadisticas"`.
router.get('/estadisticas', verificarRol(...ROLES_VENTAS), ventasController.estadisticas);
router.get('/recientes', verificarRol(...ROLES_VENTAS), ventasController.recientes);
router.get('/por-cliente', verificarRol(...ROLES_VENTAS), ventasController.porCliente);

// El propio historial del cliente de la tienda. '/mias/:id' tiene dos segmentos,
// así que no compite con '/:id'.
router.get('/mias', verificarRol('Cliente'), ventasController.mias);
router.get('/mias/:id', verificarRol('Cliente'), conId(ventasController.miaPorId));

router.get('/', verificarRol(...ROLES_VENTAS), ventasController.listar);
router.get('/:id', verificarRol(...ROLES_VENTAS), conId(ventasController.obtener));

// Un 'Cliente' también registra una venta: es el checkout de la tienda.
// El servicio lee los precios de la base de datos, así que no puede manipularlos.
router.post('/', verificarRol('Administrador', 'Vendedor', 'Cliente'), ventasController.crear);

// No hay PUT a propósito: editar una venta implica revertir el stock y
// reaplicarlo, duplicando la ventana de validación. El frontend borra y recrea.
router.delete('/:id', verificarRol('Administrador'), conId(ventasController.eliminar));

module.exports = router;
