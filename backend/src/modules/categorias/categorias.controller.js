const categoriasService = require('./categorias.service');

async function listar(req, res, next) {
  try {
    res.json(await categoriasService.obtenerTodas());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const categoria = await categoriasService.obtenerPorId(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await categoriasService.crear(req.body));
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    res.json(await categoriasService.actualizar(req.params.id, req.body));
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await categoriasService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };