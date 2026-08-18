const productosService = require('./productos.service');

async function listar(req, res, next) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const productos = await productosService.obtenerTodos({ incluirInactivos });
    res.json(productos);
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const producto = await productosService.obtenerPorId(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const nuevo = await productosService.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await productosService.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function cambiarEstado(req, res, next) {
  try {
    const actualizado = await productosService.cambiarEstado(req.params.id, req.body.activo);
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function stockBajo(req, res, next) {
  try {
    const productos = await productosService.obtenerStockBajo();
    res.json(productos);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await productosService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, stockBajo, eliminar };