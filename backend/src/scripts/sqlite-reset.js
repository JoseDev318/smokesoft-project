/**
 * Recrea desde cero el archivo SQLite de desarrollo a partir de
 * database/schema.sqlite.sql.
 *
 * No hay sistema de migraciones para SQLite: al ser una base de datos de
 * prueba/desarrollo, es más simple y más confiable borrar y reconstruir todo
 * cada vez que se corre `npm run seed`, que mantener un camino incremental
 * paralelo al de Postgres.
 *
 * Uso:  node src/scripts/sqlite-reset.js   (normalmente se llama desde seed.js)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { obtenerDriver } = require('../config/driver');

const emitirAvisoOriginal = process.emitWarning.bind(process);
process.emitWarning = (aviso, ...resto) => {
  const texto = typeof aviso === 'string' ? aviso : aviso?.message;
  if (typeof texto === 'string' && texto.includes('SQLite is an experimental feature')) return;
  return emitirAvisoOriginal(aviso, ...resto);
};

const { DatabaseSync } = require('node:sqlite');

const RUTA_BD = process.env.SQLITE_PATH
  || path.join(__dirname, '..', '..', 'database', 'smokesoft.sqlite');
const RUTA_ESQUEMA = path.join(__dirname, '..', '..', 'database', 'schema.sqlite.sql');

function resetearSqlite() {
  if (obtenerDriver() !== 'sqlite') {
    throw new Error('resetearSqlite() solo aplica cuando DB_CLIENT resuelve a "sqlite".');
  }

  // Se borran también los archivos -wal/-shm del modo WAL: si quedan sueltos,
  // apuntan a un archivo principal que ya no existe.
  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      fs.unlinkSync(RUTA_BD + sufijo);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      // En Windows, un archivo abierto por otro proceso no se puede borrar
      // (a diferencia de Linux/Mac). Es el caso típico de correr `npm run
      // seed` con `npm run dev` todavía encendido en otra terminal.
      if (error.code === 'EBUSY') {
        throw new Error(
          'No se pudo recrear la base de datos SQLite porque el archivo está en uso.\n' +
          'Detén el servidor (Ctrl+C en la terminal donde corre `npm run dev`) y vuelve a intentar.'
        );
      }
      throw error;
    }
  }

  fs.mkdirSync(path.dirname(RUTA_BD), { recursive: true });

  const conexion = new DatabaseSync(RUTA_BD);
  try {
    conexion.exec('PRAGMA foreign_keys = ON');
    conexion.exec(fs.readFileSync(RUTA_ESQUEMA, 'utf8'));
  } finally {
    conexion.close();
  }

  console.log(`Esquema SQLite recreado en ${RUTA_BD}`);
}

module.exports = { resetearSqlite, RUTA_BD };

if (require.main === module) {
  resetearSqlite();
}
