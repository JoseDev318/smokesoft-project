const { Router } = require('express');
const clientesController = require('./clientes.controller');
const verificarToken = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/role.middleware');
const { conId, ROLES_VENTAS } = require('../../utils/peticiones');

const router = Router();
router.use(verificarToken);

// --- Autogestión del cliente de la tienda ---
// OJO: '/mio' es un literal de un segmento y colisiona con '/:id'. DEBE ir
// antes, o Express matchea '/:id' y Postgres lanza
// `invalid input syntax for type integer: "mio"`.
//
// Solo pide verificarToken + rol 'Cliente': el id sale del token, así que una
// cuenta nunca puede leer la ficha de otra.
router.get('/mio', verificarRol('Cliente'), clientesController.obtenerMio);
router.put('/mio', verificarRol('Cliente'), clientesController.actualizarMio);
router.get('/mio/ventas', verificarRol('Cliente'), clientesController.misVentas);

// --- Gestión del personal ---
// 'Cliente' NO aparece en ninguna de estas listas: expondría el nombre, correo,
// teléfono y dirección de todos los demás compradores.
router.get('/', verificarRol(...ROLES_VENTAS), clientesController.listar);
router.get('/:id', verificarRol(...ROLES_VENTAS), conId(clientesController.obtener));
router.get('/:id/ventas', verificarRol(...ROLES_VENTAS), conId(clientesController.ventasDelCliente));
router.post('/', verificarRol(...ROLES_VENTAS), clientesController.crear);
router.put('/:id', verificarRol(...ROLES_VENTAS), conId(clientesController.actualizar));
router.delete('/:id', verificarRol('Administrador'), conId(clientesController.eliminar));

module.exports = router;
