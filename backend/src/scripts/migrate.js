/**
 * Aplica los archivos .sql de database/migrations que aun no se hayan corrido.
 *
 * Existe porque schema.sql solo se ejecuta en volumenes VACIOS (docker-compose
 * lo monta en docker-entrypoint-initdb.d, que no vuelve a dispararse). Para una
 * base de datos ya creada este script es el unico camino.
 *
 * Uso:  npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { obtenerDriver } = require('../config/driver');
const pool = require('../config/db');

const CARPETA = path.join(__dirname, '..', '..', 'database', 'migrations');

// Estas migraciones son DDL de Postgres (ALTER TABLE ... ADD COLUMN IF NOT
// EXISTS, entre otras cosas que SQLite no admite igual). Si el driver activo
// es sqlite, la base de prueba se arma con `npm run seed`, que recrea
// database/schema.sqlite.sql entero en lugar de aplicar migraciones.
if (obtenerDriver() !== 'postgres') {
  console.error(
    'npm run migrate es solo para Postgres. El driver activo es sqlite: usa `npm run seed`, ' +
    'que recrea el esquema de SQLite de una sola vez (ver DB_CLIENT en el README).'
  );
  process.exit(1);
}

async function asegurarTablaDeControl(clienteDB) {
  await clienteDB.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre      VARCHAR(255) PRIMARY KEY,
      aplicada_en TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function obtenerAplicadas(clienteDB) {
  const { rows } = await clienteDB.query('SELECT nombre FROM schema_migrations');
  return new Set(rows.map((fila) => fila.nombre));
}

function leerArchivos() {
  if (!fs.existsSync(CARPETA)) return [];
  return fs
    .readdirSync(CARPETA)
    .filter((nombre) => nombre.endsWith('.sql'))
    .sort(); // el prefijo numerico define el orden
}

async function migrar() {
  const clienteDB = await pool.connect();
  let aplicadasAhora = 0;

  try {
    await asegurarTablaDeControl(clienteDB);
    const aplicadas = await obtenerAplicadas(clienteDB);
    const archivos = leerArchivos();

    if (!archivos.length) {
      console.log('No hay migraciones en', CARPETA);
      return;
    }

    for (const nombre of archivos) {
      if (aplicadas.has(nombre)) {
        console.log(`  =  ${nombre} (ya aplicada)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(CARPETA, nombre), 'utf8');

      // Cada migracion en su propia transaccion: si una falla, las anteriores
      // quedan aplicadas y esta no deja nada a medias.
      try {
        await clienteDB.query('BEGIN');
        await clienteDB.query(sql);
        await clienteDB.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [nombre]);
        await clienteDB.query('COMMIT');
        aplicadasAhora += 1;
        console.log(`  +  ${nombre}`);
      } catch (error) {
        // El ROLLBACK va en su propio try para no tapar el error original.
        try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexion perdida */ }
        console.error(`\nFallo la migracion ${nombre}:`);
        throw error;
      }
    }

    console.log(
      aplicadasAhora
        ? `\nListo: ${aplicadasAhora} migracion(es) aplicada(s).`
        : '\nListo: la base de datos ya estaba al dia.'
    );
  } finally {
    clienteDB.release();
  }
}

module.exports = migrar;

// Solo cierra el pool y termina el proceso cuando se invoca como comando
// (`npm run migrate`). Cuando `seed.js` importa esta función para dejar el
// esquema al día antes de sembrar, necesita seguir usando el mismo pool
// después, así que cerrarlo aquí lo rompería.
if (require.main === module) {
  migrar()
    .then(() => pool.end())
    .catch(async (error) => {
      console.error(error.message || error);
      await pool.end().catch(() => {});
      process.exit(1);
    });
}
