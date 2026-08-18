const proveedoresService = require('./proveedores.service');

async function listar(req, res, next) {
  try {
    res.json(await proveedoresService.obtenerTodos());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const proveedor = await proveedoresService.obtenerPorId(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await proveedoresService.crear(req.body));
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    res.json(await proveedoresService.actualizar(req.params.id, req.body));
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await proveedoresService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };