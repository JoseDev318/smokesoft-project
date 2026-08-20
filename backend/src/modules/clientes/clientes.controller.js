const clientesService = require('./clientes.service');

async function listar(req, res, next) {
  try {
    res.json(await clientesService.obtenerTodos());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const cliente = await clientesService.obtenerPorId(req.idParam);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await clientesService.crear(req.body));
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await clientesService.actualizar(req.idParam, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function ventasDelCliente(req, res, next) {
  try {
    res.json(await clientesService.obtenerVentas(req.idParam));
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await clientesService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

// --- Autogestión del cliente de la tienda (rol 'Cliente') ---
// El id_cliente sale del token, nunca de la URL: así una cuenta no puede leer
// ni editar la ficha de otra.

async function idClienteDelToken(req) {
  if (!req.usuario) return null;
  if (req.usuario.id_cliente) return Number(req.usuario.id_cliente);
  // Los tokens emitidos antes de que el payload incluyera id_cliente siguen
  // siendo válidos pero no traen el claim: se resuelve contra la base de datos.
  return clientesService.obtenerIdClientePorUsuario(req.usuario.id);
}

async function obtenerMio(req, res, next) {
  try {
    const idCliente = await idClienteDelToken(req);
    if (!idCliente) {
      return res.status(404).json({ error: 'Tu cuenta no tiene una ficha de cliente asociada' });
    }
    const cliente = await clientesService.obtenerPorId(idCliente);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) { next(error); }
}

async function actualizarMio(req, res, next) {
  try {
    const idCliente = await idClienteDelToken(req);
    if (!idCliente) {
      return res.status(404).json({ error: 'Tu cuenta no tiene una ficha de cliente asociada' });
    }
    const actualizado = await clientesService.actualizar(idCliente, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function misVentas(req, res, next) {
  try {
    const idCliente = await idClienteDelToken(req);
    if (!idCliente) return res.json([]);
    res.json(await clientesService.obtenerVentas(idCliente));
  } catch (error) { next(error); }
}

module.exports = {
  listar, obtener, crear, actualizar, ventasDelCliente, eliminar,
  obtenerMio, actualizarMio, misVentas,
};
