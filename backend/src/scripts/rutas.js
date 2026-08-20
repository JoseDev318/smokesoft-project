/**
 * Lista todas las rutas registradas, EN ORDEN DE DECLARACIÓN.
 *
 * Existe porque en Express el orden importa: una ruta literal de un segmento
 * (como `/stock-bajo`) tiene que declararse antes que `/:id`, o Express matchea
 * el parámetro y Postgres lanza `invalid input syntax for type integer`.
 * Este script permite verificarlo de un vistazo.
 *
 * Uso:  node src/scripts/rutas.js
 */
const app = require('../app');

const MONTAJES = [
  ['/api/auth', '../modules/auth/auth.routes'],
  ['/api/usuarios', '../modules/usuarios/usuarios.routes'],
  ['/api/productos', '../modules/productos/productos.routes'],
  ['/api/categorias', '../modules/categorias/categorias.routes'],
  ['/api/proveedores', '../modules/proveedores/proveedores.routes'],
  ['/api/clientes', '../modules/clientes/clientes.routes'],
  ['/api/ventas', '../modules/ventas/ventas.routes'],
  ['/api/compras', '../modules/compras/compras.routes'],
];

let total = 0;

console.log('GET  /api/health\n');

for (const [prefijo, modulo] of MONTAJES) {
  const router = require(modulo);
  console.log(`--- ${prefijo} ---`);

  for (const capa of router.stack) {
    if (!capa.route) {
      // router.use(...) sin ruta: middleware que aplica a todo el módulo.
      console.log(`     (middleware para todo el módulo)`);
      continue;
    }
    const metodos = Object.keys(capa.route.methods)
      .map((m) => m.toUpperCase())
      .join(',');
    // Cada handler intermedio es un middleware; el último es el controlador.
    const middlewares = capa.route.stack.length - 1;
    console.log(
      `${metodos.padEnd(6)} ${(prefijo + capa.route.path).padEnd(34)} middlewares: ${middlewares}`
    );
    total += 1;
  }
  console.log('');
}

console.log(`Total de endpoints: ${total + 1} (incluyendo /api/health)`);

// Se cierra el pool para que el proceso termine.
require('../config/db').end().catch(() => {});
void app;
