const usuariosService = require('./usuarios.service');

async function listar(req, res, next) {
  try {
    const usuarios = await usuariosService.obtenerTodos();
    res.json(usuarios);
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const usuario = await usuariosService.obtenerPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const nuevo = await usuariosService.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await usuariosService.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function cambiarEstado(req, res, next) {
  try {
    const actualizado = await usuariosService.cambiarEstado(req.params.id, req.body.estado);
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await usuariosService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar };