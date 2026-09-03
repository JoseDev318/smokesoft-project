const comprasService = require('./compras.service');

async function listar(req, res, next) {
  try {
    res.json(await comprasService.obtenerTodas());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const compra = await comprasService.obtenerPorId(req.params.id);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const { id_proveedor, productos } = req.body;
    const nueva = await comprasService.crear({
      id_proveedor,
      id_usuario: req.usuario.id, // viene del token, no del body — no se puede falsear
      productos,
    });
    res.status(201).json(nueva);
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear };