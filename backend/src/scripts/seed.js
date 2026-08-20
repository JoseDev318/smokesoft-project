/**
 * Deja la base de datos lista para probar la aplicación con UN SOLO COMANDO:
 *
 *   npm run seed
 *
 * Arma el esquema (recrea el archivo SQLite desde cero, o aplica las
 * migraciones pendientes en Postgres) y carga un set de datos de prueba
 * completo y relacionado entre sí: categorías, proveedores, productos,
 * clientes, un usuario por cada rol, compras y ventas.
 *
 * GUARDA DE SEGURIDAD: se niega a correr si NODE_ENV=production. Este script
 * BORRA los datos existentes antes de insertar los de prueba (el archivo
 * entero en SQLite; TRUNCATE de las tablas en Postgres), así que solo tiene
 * sentido contra una base de datos local o de desarrollo — nunca una real.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production') {
  console.error(
    'npm run seed está deshabilitado con NODE_ENV=production: este comando BORRA ' +
    'los datos existentes antes de sembrar. Es solo para desarrollo local (ver ' +
    'la sección "Base de datos" del README).'
  );
  process.exit(1);
}

const { obtenerDriver } = require('../config/driver');
const driver = obtenerDriver();

// IVA con el mismo redondeo que usa el servicio de ventas (Math.round), para
// que los totales sembrados sean exactamente los que la aplicación calcularía
// con las mismas líneas.
const IVA = 0.19;
function calcularIva(subtotal) {
  return Math.round(subtotal * IVA);
}

async function main() {
  if (driver === 'sqlite') {
    // SQLite arranca siempre desde cero: no hay nada que preservar en una
    // base de solo pruebas, y así se evita mantener un camino de migraciones
    // paralelo al de Postgres.
    require('./sqlite-reset').resetearSqlite();
  }

  const pool = require('../config/db');

  if (driver === 'postgres') {
    // Deja el esquema al día aunque haya migraciones sin aplicar: así
    // `npm run seed` sigue siendo el único comando que hace falta.
    await require('./migrate')();
    await vaciarTablasPostgres(pool);
  }

  const resumen = await sembrar(pool);
  await pool.end();

  console.log('');
  console.log(
    driver === 'sqlite'
      ? `Base de datos SQLite recreada en ${require('./sqlite-reset').RUTA_BD}`
      : 'Tablas de Postgres reiniciadas y sembradas'
  );
  console.log(
    `${resumen.categorias} categorías, ${resumen.proveedores} proveedores, ` +
    `${resumen.productos} productos, ${resumen.clientes} clientes, ` +
    `${resumen.usuarios} usuarios, ${resumen.compras} compras, ${resumen.ventas} ventas.`
  );
  console.log('');
  console.log('Usuarios de prueba (usuario / clave):');
  console.log('  admin      / admin123       (Administrador)');
  console.log('  maria      / vendedor123    (Vendedor)');
  console.log('  carlos     / inventario123  (Inventario)');
  console.log('  juanperez  / cliente123     (Cliente, ligado a la ficha de "Juan Pérez")');
}

/**
 * Solo aplica a Postgres: SQLite ya arranca vacío porque sqlite-reset.js
 * recrea el archivo entero. RESTART IDENTITY reinicia los SERIAL a 1, para que
 * los ids queden igual de predecibles que en un archivo SQLite nuevo.
 */
async function vaciarTablasPostgres(pool) {
  await pool.query(`
    TRUNCATE TABLE
      detalle_venta, detalle_compra, venta, compra,
      producto, cliente, proveedor, categoria, usuario
    RESTART IDENTITY CASCADE
  `);
}

async function sembrar(pool) {
  const idCategoria = await insertarCategorias(pool);
  const idProveedor = await insertarProveedores(pool);
  const idProducto = await insertarProductos(pool, idCategoria, idProveedor);
  const idCliente = await insertarClientes(pool);
  const idUsuario = await insertarUsuarios(pool, idCliente);
  const nCompras = await insertarCompras(pool, idProveedor, idProducto, idUsuario);
  const nVentas = await insertarVentas(pool, idCliente, idProducto, idUsuario);

  return {
    categorias: Object.keys(idCategoria).length,
    proveedores: Object.keys(idProveedor).length,
    productos: Object.keys(idProducto).length,
    clientes: Object.keys(idCliente).length,
    usuarios: Object.keys(idUsuario).length,
    compras: nCompras,
    ventas: nVentas,
  };
}

async function insertarCategorias(pool) {
  const datos = [
    ['Encendedores', 'Encendedores de todo tipo'],
    ['Pipas', 'Pipas de madera y metal'],
    ['Vaporizadores', 'Vaporizadores desechables y recargables'],
    ['Papeles', 'Papel de liar en distintos tamaños'],
    ['Accesorios', 'Grinders, filtros y demás accesorios'],
    ['Esencias', 'Líquidos y esencias saborizadas'],
    ['Pipas de Vidrio', 'Bongs y pipas de vidrio'],
  ];

  const ids = {};
  for (const [nombre, descripcion] of datos) {
    const { rows: [fila] } = await pool.query(
      'INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING id_categoria',
      [nombre, descripcion]
    );
    ids[nombre] = fila.id_categoria;
  }
  return ids;
}

async function insertarProveedores(pool) {
  const datos = [
    ['Distribuidora La Fuma', '3001234567', 'Zona Industrial 45', 'contacto@lafuma.com'],
    ['Insumos Premium S.A.S', '6015551234', 'Carrera 30 # 45-20', 'ventas@premium.com'],
    ['Importadora Smoke Co.', '6048889900', 'Bodega 12, Mz 4', 'info@smokeco.com'],
  ];

  const ids = {};
  for (const [nombre, telefono, direccion, correo] of datos) {
    const { rows: [fila] } = await pool.query(
      'INSERT INTO proveedor (nombre, telefono, direccion, correo) VALUES ($1, $2, $3, $4) RETURNING id_proveedor',
      [nombre, telefono, direccion, correo]
    );
    ids[nombre] = fila.id_proveedor;
  }
  return ids;
}

async function insertarProductos(pool, idCategoria, idProveedor) {
  // nombre, descripción, precio, stock, stock_minimo, categoría, proveedor, imagen, activo
  const datos = [
    ['Encendedor Clipper', 'Encendedor recargable de alta duración', 7800, 45, 10,
      'Encendedores', 'Distribuidora La Fuma', 'encendedor-cliper.webp', true],
    ['Pipa Bate Gold', 'Pipa metálica estilo bate', 12000, 23, 5,
      'Pipas', 'Insumos Premium S.A.S', 'pipa-bate-gold.webp', true],
    ['Pipa Mini Gold', 'Pipa compacta de bolsillo', 8000, 67, 10,
      'Pipas', 'Insumos Premium S.A.S', 'pipa-mini-gold.jpg', true],
    ['Vaper Desechable Frutas', 'Vaporizador desechable sabor frutas', 40000, 89, 15,
      'Vaporizadores', 'Importadora Smoke Co.', 'vaper.webp', true],
    ['Papel RAW King Size', 'Papel de liar tamaño King Size', 10000, 156, 30,
      'Papeles', 'Distribuidora La Fuma', 'papel-raw-king-size.png', true],
    ['Moledor KRUSH KUBE', 'Grinder metálico de 4 piezas', 120000, 12, 5,
      'Accesorios', 'Importadora Smoke Co.', 'moledor-kush-kube.jpeg', true],
    // Stock por debajo del mínimo A PROPÓSITO: ejercita el panel de stock bajo
    // y el "Stock bajo" del dashboard sin tener que vender nada a mano.
    ['Bong GRAV Labs', 'Bong de vidrio borosilicato', 350000, 2, 3,
      'Pipas de Vidrio', 'Insumos Premium S.A.S', 'bong-grav-labs.webp', true],
    ['Esencia Nasty Juice Mango', 'Esencia saborizada sabor mango', 75000, 34, 10,
      'Esencias', 'Importadora Smoke Co.', 'esencia-nasty-juice-mango.webp', true],
    ['Filtro Slim', 'Filtros delgados para armar', 3500, 200, 50,
      'Accesorios', 'Distribuidora La Fuma', null, true],
    ['Grinder Metálico', 'Grinder de 2 piezas', 45000, 18, 5,
      'Accesorios', 'Insumos Premium S.A.S', null, true],
    // Inactivo a propósito: ejercita el filtro "incluirInactivos" y el botón
    // Activar/Desactivar del panel sin tener que crear uno a mano.
    ['Vaper Antiguo (Descontinuado)', 'Modelo descontinuado, ya no se vende', 35000, 0, 5,
      'Vaporizadores', 'Importadora Smoke Co.', null, false],
  ];

  const ids = {};
  for (const [nombre, descripcion, precio, stock, stockMinimo, categoria, proveedor, imagen, activo] of datos) {
    const { rows: [fila] } = await pool.query(
      `INSERT INTO producto (nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, imagen, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_producto`,
      [nombre, descripcion, precio, stock, stockMinimo, idCategoria[categoria], idProveedor[proveedor], imagen, activo]
    );
    ids[nombre] = fila.id_producto;
  }
  return ids;
}

async function insertarClientes(pool) {
  const datos = [
    ['Juan Pérez', 'juanperez@gmail.com', '3001234567', 'Calle 10 # 20-30', 'CC', '1000234567'],
    ['María García', 'mariagarcia@gmail.com', '3009876543', 'Carrera 5 # 15-40', 'CC', '1000345678'],
    ['Carlos López', 'carloslopez@gmail.com', '3015551234', 'Av. Principal # 8-12', 'CC', '1000456789'],
    ['Ana Rodríguez', 'anarodriguez@gmail.com', '3024445566', 'Calle 45 # 12-8', 'CC', '1000567890'],
    ['Roberto Díaz', 'robertodiaz@gmail.com', '3037778899', 'Carrera 20 # 30-15', 'CE', '1000678901'],
  ];

  const ids = {};
  for (const [nombre, correo, telefono, direccion, tipoDocumento, documento] of datos) {
    const { rows: [fila] } = await pool.query(
      `INSERT INTO cliente (nombre, correo, telefono, direccion, tipo_documento, documento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_cliente`,
      [nombre, correo, telefono, direccion, tipoDocumento, documento]
    );
    ids[nombre] = fila.id_cliente;
  }
  return ids;
}

async function insertarUsuarios(pool, idCliente) {
  // Se hashean las claves EN EL MOMENTO de sembrar, en vez de pegar un hash
  // fijo en el SQL: así se garantiza que "admin123" etc. realmente funcionan
  // al iniciar sesión, sin depender de que un hash pegado a mano siga siendo
  // válido.
  const hash = (clave) => bcrypt.hashSync(clave, 10);

  const staff = [
    ['Administrador', 'admin', 'admin@smokesoft.com', hash('admin123'), 'Administrador'],
    ['María Vendedora', 'maria', 'maria@smokesoft.com', hash('vendedor123'), 'Vendedor'],
    ['Carlos Inventario', 'carlos', 'carlos@smokesoft.com', hash('inventario123'), 'Inventario'],
  ];

  const ids = {};
  for (const [nombre, usuario, correo, claveHash, rol] of staff) {
    const { rows: [fila] } = await pool.query(
      `INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id_usuario`,
      [nombre, usuario, correo, claveHash, rol]
    );
    ids[usuario] = fila.id_usuario;
  }

  // Cuenta de tienda ligada a la ficha de cliente "Juan Pérez", para poder
  // probar el flujo de compra (catálogo -> carrito -> checkout -> "Mis
  // pedidos") como cliente autenticado sin tener que registrarse a mano.
  const { rows: [cuenta] } = await pool.query(
    `INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado, id_cliente)
     VALUES ($1, $2, $3, $4, 'Cliente', true, $5)
     RETURNING id_usuario`,
    ['Juan Pérez', 'juanperez', 'juanperez@gmail.com', hash('cliente123'), idCliente['Juan Pérez']]
  );
  ids.juanperez = cuenta.id_usuario;

  return ids;
}

async function insertarCompras(pool, idProveedor, idProducto, idUsuario) {
  const compras = [
    {
      proveedor: 'Distribuidora La Fuma', usuario: 'carlos', fecha: '2026-07-15',
      notas: 'Reposición mensual',
      items: [
        { producto: 'Encendedor Clipper', cantidad: 50, precioUnitario: 5200 },
        { producto: 'Papel RAW King Size', cantidad: 100, precioUnitario: 6500 },
      ],
    },
    {
      proveedor: 'Importadora Smoke Co.', usuario: 'carlos', fecha: '2026-08-01',
      notas: 'Pedido de vaporizadores',
      items: [{ producto: 'Vaper Desechable Frutas', cantidad: 40, precioUnitario: 25000 }],
    },
  ];

  for (const compra of compras) {
    const detalles = compra.items.map((item) => ({
      ...item, subtotal: Math.round(item.precioUnitario * item.cantidad),
    }));
    const total = detalles.reduce((suma, d) => suma + d.subtotal, 0);

    const { rows: [fila] } = await pool.query(
      `INSERT INTO compra (fecha, id_proveedor, id_usuario, total, notas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_compra`,
      [compra.fecha, idProveedor[compra.proveedor], idUsuario[compra.usuario], total, compra.notas]
    );

    for (const detalle of detalles) {
      await pool.query(
        `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [fila.id_compra, idProducto[detalle.producto], detalle.cantidad, detalle.precioUnitario, detalle.subtotal]
      );
    }
  }
  return compras.length;
}

async function insertarVentas(pool, idCliente, idProducto, idUsuario) {
  const ventas = [
    {
      cliente: 'Juan Pérez', usuario: 'maria', fecha: '2026-08-10', notas: null,
      items: [
        { producto: 'Encendedor Clipper', cantidad: 3, precioUnitario: 7800 },
        { producto: 'Papel RAW King Size', cantidad: 2, precioUnitario: 10000 },
      ],
    },
    {
      cliente: 'María García', usuario: 'maria', fecha: '2026-08-12', notas: 'Entrega express',
      items: [{ producto: 'Vaper Desechable Frutas', cantidad: 1, precioUnitario: 40000 }],
    },
    {
      cliente: 'Carlos López', usuario: 'maria', fecha: '2026-08-15', notas: null,
      items: [
        { producto: 'Bong GRAV Labs', cantidad: 1, precioUnitario: 350000 },
        { producto: 'Moledor KRUSH KUBE', cantidad: 1, precioUnitario: 120000 },
      ],
    },
    {
      // El propio cliente comprando desde su cuenta: id_usuario es su propia
      // cuenta, igual que hace POST /api/ventas cuando lo llama un rol
      // 'Cliente' (el backend ignora cualquier id_cliente del body en ese
      // caso y usa el del token).
      cliente: 'Juan Pérez', usuario: 'juanperez', fecha: '2026-08-18', notas: null,
      items: [{ producto: 'Esencia Nasty Juice Mango', cantidad: 1, precioUnitario: 75000 }],
    },
  ];

  for (const venta of ventas) {
    const detalles = venta.items.map((item) => ({
      ...item, subtotal: Math.round(item.precioUnitario * item.cantidad),
    }));
    const subtotal = detalles.reduce((suma, d) => suma + d.subtotal, 0);
    const iva = calcularIva(subtotal);
    const total = subtotal + iva;

    const { rows: [fila] } = await pool.query(
      `INSERT INTO venta (id_cliente, id_usuario, fecha, subtotal, iva, total, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_venta`,
      [idCliente[venta.cliente], idUsuario[venta.usuario], venta.fecha, subtotal, iva, total, venta.notas]
    );

    for (const detalle of detalles) {
      await pool.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [fila.id_venta, idProducto[detalle.producto], detalle.cantidad, detalle.precioUnitario, detalle.subtotal]
      );
    }
  }
  return ventas.length;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
