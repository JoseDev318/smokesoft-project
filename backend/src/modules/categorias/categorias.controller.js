const categoriasService = require('./categorias.service');

async function listar(req, res, next) {
  try {
    res.json(await categoriasService.obtenerTodas());
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const categoria = await categoriasService.obtenerPorId(req.idParam);
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
    const actualizada = await categoriasService.actualizar(req.idParam, req.body);
    // Sin esta guarda, un id inexistente devolvía 200 con cuerpo vacío
    // (res.json(undefined)) y el frontend lo leía como "guardado".
    if (!actualizada) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(actualizada);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await categoriasService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
