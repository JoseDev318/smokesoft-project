const ventasService = require('./ventas.service');
const clientesService = require('../clientes/clientes.service');

async function listar(req, res, next) {
  try {
    const { desde, hasta, id_cliente } = req.query;
    res.json(await ventasService.obtenerTodas({ desde, hasta, id_cliente }));
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const venta = await ventasService.obtenerPorId(req.idParam);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(venta);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const datos = { ...req.body };

    // Un 'Cliente' solo puede comprar para sí mismo: se ignora el id_cliente
    // del body y se toma el del token. Sin esto podría registrar una venta a
    // nombre de cualquier otro cliente.
    if (req.usuario.rol === 'Cliente') {
      let idCliente = req.usuario.id_cliente;
      if (!idCliente) {
        idCliente = await clientesService.obtenerIdClientePorUsuario(req.usuario.id);
      }
      if (!idCliente) {
        return res.status(409).json({
          error: 'Tu cuenta no tiene una ficha de cliente asociada',
        });
      }
      datos.id_cliente = idCliente;
    }

    // El id_usuario sale del token, nunca del body: es quien registra la venta.
    const venta = await ventasService.crear(datos, req.usuario.id);
    res.status(201).json(venta);
  } catch (error) { next(error); }
}

async function estadisticas(req, res, next) {
  try {
    res.json(await ventasService.obtenerEstadisticas());
  } catch (error) { next(error); }
}

async function recientes(req, res, next) {
  try {
    const limite = Number(req.query.limite) > 0 ? Number(req.query.limite) : 5;
    res.json(await ventasService.obtenerRecientes(limite));
  } catch (error) { next(error); }
}

async function porCliente(req, res, next) {
  try {
    res.json(await ventasService.obtenerResumenPorCliente());
  } catch (error) { next(error); }
}

// Historial del cliente autenticado. El id_cliente sale del token, así que una
// cuenta nunca puede ver los pedidos de otra.
async function mias(req, res, next) {
  try {
    let idCliente = req.usuario.id_cliente;
    if (!idCliente) {
      // Tokens emitidos antes de que el payload incluyera id_cliente.
      idCliente = await clientesService.obtenerIdClientePorUsuario(req.usuario.id);
    }
    if (!idCliente) return res.json([]);
    res.json(await ventasService.obtenerPorCliente(idCliente));
  } catch (error) { next(error); }
}

// Detalle de un pedido propio (página de confirmación e historial del cliente).
// Se comprueba que la venta le pertenezca antes de devolverla.
async function miaPorId(req, res, next) {
  try {
    let idCliente = req.usuario.id_cliente;
    if (!idCliente) {
      idCliente = await clientesService.obtenerIdClientePorUsuario(req.usuario.id);
    }

    const venta = await ventasService.obtenerPorId(req.idParam);
    // Mismo 404 si no existe o si es de otra persona: no se revela si el pedido
    // existe pero es ajeno.
    if (!venta || !idCliente || Number(venta.id_cliente) !== Number(idCliente)) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(venta);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await ventasService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = {
  listar, obtener, crear, estadisticas, recientes, porCliente,
  mias, miaPorId, eliminar,
};
