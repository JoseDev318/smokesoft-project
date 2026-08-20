/**
 * Resuelve qué motor de base de datos usar.
 *
 * - `DB_CLIENT` explícito ('postgres' | 'sqlite') siempre gana.
 * - Sin `DB_CLIENT`: 'postgres' cuando NODE_ENV=production, 'sqlite' en
 *   cualquier otro caso (local, develop, o sin NODE_ENV definido).
 *
 * Así un `git clone` + `npm install` + `npm run seed` funciona de una sin
 * instalar Docker ni Postgres, y un despliegue real solo usa SQLite si alguien
 * lo pide a propósito con NODE_ENV=production sin haber fijado DB_CLIENT.
 * Para no dejarlo a la suerte, un despliegue real DEBE fijar
 * `DB_CLIENT=postgres` explícitamente (ver README).
 */
function obtenerDriver() {
  const explicito = (process.env.DB_CLIENT || '').trim().toLowerCase();
  if (explicito === 'postgres' || explicito === 'sqlite') return explicito;
  return process.env.NODE_ENV === 'production' ? 'postgres' : 'sqlite';
}

module.exports = { obtenerDriver };
