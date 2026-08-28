const clientesService = require('./clientes.service');

async function listar(req, res, next) {
  try {
    const busqueda = req.query.q;
    const clientes = await clientesService.obtenerTodos({ busqueda });
    res.json(clientes);
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const cliente = await clientesService.obtenerPorId(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const nuevo = await clientesService.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await clientesService.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await clientesService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };