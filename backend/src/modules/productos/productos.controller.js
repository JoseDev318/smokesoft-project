const productosService = require('./productos.service');
const { tieneRol, ROLES_INVENTARIO } = require('../../utils/peticiones');

async function listar(req, res, next) {
  try {
    // Esta ruta es pública, así que req.usuario puede venir sin definir.
    // Solo el personal de inventario puede pedir los productos desactivados:
    // un anónimo (o un Cliente) recibe el catálogo público aunque mande
    // ?incluirInactivos=true.
    const incluirInactivos =
      req.query.incluirInactivos === 'true' && tieneRol(req.usuario, ROLES_INVENTARIO);

    const productos = await productosService.obtenerTodos({ incluirInactivos });
    res.json(productos);
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const puedeVerInactivos = tieneRol(req.usuario, ROLES_INVENTARIO);
    const producto = await productosService.obtenerPorId(req.idParam, {
      incluirInactivos: puedeVerInactivos,
    });
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
    const actualizado = await productosService.actualizar(req.idParam, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function cambiarEstado(req, res, next) {
  try {
    const actualizado = await productosService.cambiarEstado(req.idParam, req.body.activo);
    if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

// Ajuste manual de inventario: { cantidad, motivo? } con cantidad como delta con signo.
// `motivo` se acepta y se ignora: no hay tabla de movimientos todavía.
async function ajustarStock(req, res, next) {
  try {
    const producto = await productosService.ajustarStock(req.idParam, req.body.cantidad);
    res.json(producto);
  } catch (error) { next(error); }
}

async function stockBajo(req, res, next) {
  try {
    res.json(await productosService.obtenerStockBajo());
  } catch (error) { next(error); }
}

async function resumen(req, res, next) {
  try {
    res.json(await productosService.obtenerResumen());
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await productosService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = {
  listar, obtener, crear, actualizar, cambiarEstado,
  ajustarStock, stockBajo, resumen, eliminar,
};
