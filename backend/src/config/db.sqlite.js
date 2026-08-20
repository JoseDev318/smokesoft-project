/**
 * Adaptador de SQLite para desarrollo local, con la MISMA forma que el pool de
 * `pg` (`query`, `connect().query/.release`, `end`): ningún servicio necesita
 * saber cuál de los dos motores está activo. Ver config/driver.js para cuándo
 * se elige uno u otro.
 *
 * Usa `node:sqlite`, incorporado en Node desde la 22.5 (con un aviso de
 * "experimental" que se filtra más abajo). No agrega ninguna dependencia
 * nueva ni nada que compilar — por eso es la opción por defecto en desarrollo:
 * ni Docker, ni Postgres, ni un módulo nativo que pueda fallar al instalar.
 *
 * SOLO PENSADO PARA DESARROLLO/PRUEBAS LOCALES. No hay pool real: cada
 * connect() envuelve la misma conexión SQLite subyacente (síncrona), así que
 * dos transacciones que se solaparan en el tiempo competirían por ella. Eso no
 * pasa en el uso normal de un único desarrollador corriendo la API local.
 */

// node:sqlite avisa "SQLite is an experimental feature..." en cada arranque.
// Se filtra ESE mensaje puntual, sin tocar ningún otro aviso del proceso.
const emitirAvisoOriginal = process.emitWarning.bind(process);
process.emitWarning = (aviso, ...resto) => {
  const texto = typeof aviso === 'string' ? aviso : aviso?.message;
  if (typeof texto === 'string' && texto.includes('SQLite is an experimental feature')) return;
  return emitirAvisoOriginal(aviso, ...resto);
};

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const RUTA_BD = process.env.SQLITE_PATH
  || path.join(__dirname, '..', '..', 'database', 'smokesoft.sqlite');

fs.mkdirSync(path.dirname(RUTA_BD), { recursive: true });

const conexion = new DatabaseSync(RUTA_BD);
conexion.exec('PRAGMA foreign_keys = ON');
conexion.exec('PRAGMA journal_mode = WAL');

// Columnas que en Postgres son BOOLEAN. SQLite no tiene tipo booleano: se
// guardan como 0/1 y aquí se devuelven como true/false para que el resto de
// la aplicación (controladores, frontend) reciba lo mismo que con Postgres.
const COLUMNAS_BOOLEANAS = new Set(['activo', 'estado']);

function normalizarFila(fila) {
  for (const columna of COLUMNAS_BOOLEANAS) {
    if (columna in fila) fila[columna] = Boolean(fila[columna]);
  }
  return fila;
}

/**
 * Traduce una consulta escrita para `pg` a sintaxis de SQLite, y reconstruye
 * el array de parámetros en el mismo orden en que aparecen los placeholders en
 * el texto. Postgres permite repetir "$1" para reusar un valor (como en
 * `actualizarStock`); con "?" posicional cada aparición necesita su propio
 * valor, así que aquí se duplica el valor original tantas veces como haga
 * falta en vez de asumir una correspondencia 1 a 1.
 */
function traducir(textoOriginal, paramsOriginales) {
  let sql = textoOriginal
    .replace(/::\w+/g, '')                       // quita los casts ::text ::int de Postgres
    .replace(/\bFOR UPDATE\b/gi, '')              // SQLite serializa escrituras: no hace falta bloqueo de fila
    .replace(/\bSTRING_AGG\s*\(/gi, 'GROUP_CONCAT(');

  const paramsTraducidos = [];
  sql = sql.replace(/\$(\d+)/g, (_coincidencia, numero) => {
    const valor = paramsOriginales[Number(numero) - 1];
    // node:sqlite solo acepta number/string/bigint/buffer/null: un boolean de
    // JS (ej. el `activo` de PATCH /estado) hay que pasarlo como 0/1.
    if (typeof valor === 'boolean') {
      paramsTraducidos.push(valor ? 1 : 0);
    } else if (valor === undefined) {
      // `pg` convierte `undefined` en NULL de forma transparente (así es como
      // un campo ausente en el body, ej. POST /api/categorias con {}, termina
      // como "El campo Nombre es obligatorio" y no como un error de conexión).
      // node:sqlite no hace esa conversión sola: sin este paso, el mismo
      // request lanza "Provided value cannot be bound..." en vez del mensaje
      // en español de la violación NOT NULL.
      paramsTraducidos.push(null);
    } else {
      paramsTraducidos.push(valor);
    }
    return '?';
  });

  return { sql, params: paramsTraducidos };
}

/** Decide si una sentencia devuelve filas (SELECT, o INSERT/UPDATE...RETURNING). */
function devuelveFilas(sqlOriginal) {
  const normalizado = sqlOriginal.trim().toUpperCase();
  return normalizado.startsWith('SELECT') || /\bRETURNING\b/.test(normalizado);
}

// Códigos de error extendidos de SQLite (estables, forman parte del protocolo
// C de la librería): 2067 = SQLITE_CONSTRAINT_UNIQUE, 1299 = ...NOTNULL,
// 787 = ...FOREIGNKEY.
const CODIGOS_SQLITE = { UNIQUE: 2067, NOT_NULL: 1299, FOREIGN_KEY: 787 };

/**
 * Traduce un error de SQLite a la forma { code, constraint, column } que ya
 * espera `utils/errores.js` (escrito pensando en los códigos de Postgres:
 * 23505 único, 23502 no-nulo, 23503 llave foránea). Así ese archivo — y cada
 * `MENSAJES` de cada servicio que lo usa — funciona sin cambios sin importar
 * el motor activo.
 *
 * El `.message` del error TAMBIÉN se reescribe con el fraseo de Postgres
 * ("null value in column...", "duplicate key value violates..."). Esto
 * importa porque no todos los `crear`/`actualizar` del backend pasan por
 * `conErroresLegibles` (ej. categorías, proveedores): los que no, dejan
 * escapar el mensaje crudo hasta el cliente, y es el FRONTEND quien lo
 * traduce a español con expresiones regulares pensadas para el fraseo de
 * Postgres (ver frontend/src/shared/api/traducirError.ts). Sin este ajuste,
 * esos mismos errores bajo SQLite llegarían con el texto de SQLite y esas
 * expresiones no los reconocerían.
 */
function normalizarError(error) {
  if (typeof error.errcode !== 'number') return error;

  if (error.errcode === CODIGOS_SQLITE.NOT_NULL) {
    const coincidencia = /NOT NULL constraint failed: (\w+)\.(\w+)/.exec(error.message);
    const [tabla, columna] = coincidencia ? [coincidencia[1], coincidencia[2]] : [null, null];
    const mensaje = tabla
      ? `null value in column "${columna}" of relation "${tabla}" violates not-null constraint`
      : error.message;
    return Object.assign(new Error(mensaje), { code: '23502', column: columna });
  }

  if (error.errcode === CODIGOS_SQLITE.UNIQUE) {
    const coincidencia = /UNIQUE constraint failed: (\w+)\.(\w+)/.exec(error.message);
    // Se sintetiza un nombre "tabla_columna_key" igual al que usan las
    // migraciones de Postgres, para que los `.includes('correo')` que ya
    // existen en los servicios (y las expresiones regulares del frontend)
    // elijan el mismo mensaje sin tocarlos.
    const restriccion = coincidencia ? `${coincidencia[1]}_${coincidencia[2]}_key` : 'unique_key';
    const mensaje = `duplicate key value violates unique constraint "${restriccion}"`;
    return Object.assign(new Error(mensaje), { code: '23505', constraint: restriccion });
  }

  if (error.errcode === CODIGOS_SQLITE.FOREIGN_KEY) {
    // SQLite no dice qué tabla origina el conflicto (a diferencia de
    // Postgres), así que solo se puede igualar el fraseo GENÉRICO. Las reglas
    // del frontend que buscan una tabla específica ("producto",
    // "detalle_venta"...) no van a disparar bajo SQLite; sí lo hace su regla
    // de respaldo, que no exige nombrar la tabla.
    const mensaje = 'insert or update on table violates foreign key constraint';
    return Object.assign(new Error(mensaje), { code: '23503' });
  }

  return error;
}

const PALABRAS_DE_CONTROL = new Set(['BEGIN', 'COMMIT', 'ROLLBACK']);

function ejecutar(textoOriginal, paramsOriginales = []) {
  const textoLimpio = textoOriginal.trim();

  try {
    if (PALABRAS_DE_CONTROL.has(textoLimpio.toUpperCase())) {
      conexion.exec(textoLimpio.toUpperCase());
      return { rows: [], rowCount: 0 };
    }

    const { sql, params } = traducir(textoOriginal, paramsOriginales);
    const sentencia = conexion.prepare(sql);

    if (devuelveFilas(textoOriginal)) {
      const filas = sentencia.all(...params).map(normalizarFila);
      return { rows: filas, rowCount: filas.length };
    }

    const info = sentencia.run(...params);
    return { rows: [], rowCount: info.changes };
  } catch (error) {
    throw normalizarError(error);
  }
}

async function query(texto, params) {
  return ejecutar(texto, params);
}

/**
 * No hay pooling real: node:sqlite es una única conexión síncrona. Se envuelve
 * igual que un cliente de `pg` (`.query`, `.release`) para que las
 * transacciones de ventas/compras/auth no necesiten saber qué motor está
 * activo.
 */
async function connect() {
  return { query, release: () => {} };
}

async function end() {
  conexion.close();
}

module.exports = { query, connect, end, driver: 'sqlite', RUTA_BD };
