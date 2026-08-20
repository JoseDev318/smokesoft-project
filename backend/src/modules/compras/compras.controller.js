const comprasService = require('./compras.service');

async function listar(req, res, next) {
  try {
    res.json(await comprasService.obtenerTodas());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const compra = await comprasService.obtenerPorId(req.idParam);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    // El id_usuario sale del token: es quien registra la compra.
    const compra = await comprasService.crear(req.body, req.usuario.id);
    res.status(201).json(compra);
  } catch (error) { next(error); }
}

async function estadisticas(req, res, next) {
  try {
    res.json(await comprasService.obtenerEstadisticas());
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await comprasService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, estadisticas, eliminar };
