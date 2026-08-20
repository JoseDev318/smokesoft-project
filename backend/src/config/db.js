require('dotenv').config();
const { obtenerDriver } = require('./driver');

/**
 * Selecciona el motor de base de datos según DB_CLIENT/NODE_ENV (ver
 * config/driver.js). Los dos adaptadores exponen la misma forma
 * (`query`, `connect`, `end`), así que ningún otro archivo del backend
 * necesita saber cuál está activo.
 */
module.exports = obtenerDriver() === 'sqlite'
  ? require('./db.sqlite')
  : require('./db.postgres');
