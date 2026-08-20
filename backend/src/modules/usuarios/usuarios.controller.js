const usuariosService = require('./usuarios.service');

async function listar(req, res, next) {
  try {
    const incluirClientes = req.query.incluirClientes === 'true';
    const usuarios = await usuariosService.obtenerTodos({ incluirClientes });
    res.json(usuarios);
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const usuario = await usuariosService.obtenerPorId(req.idParam);
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
    const actualizado = await usuariosService.actualizar(req.idParam, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function cambiarEstado(req, res, next) {
  try {
    const actualizado = await usuariosService.cambiarEstado(req.idParam, req.body.estado);
    if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    await usuariosService.eliminar(req.idParam);
    res.status(204).send();
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar };
