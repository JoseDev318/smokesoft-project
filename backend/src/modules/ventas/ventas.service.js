const pool = require('../../config/db');
const productosService = require('../productos/productos.service');

// El IVA se guarda en cada venta, así que cambiar esta constante no reescribe
// el histórico: las facturas viejas conservan el que se les calculó.
const IVA = 0.19;

// `fecha::text` en todos los SELECT: si se deja como DATE, `pg` la convierte a
// Date y JSON la serializa como timestamp UTC, que en Bogotá (UTC-5) muestra el
// día anterior.
const COLUMNAS_VENTA = `
  v.id_venta, v.id_cliente, v.id_usuario, v.fecha::text AS fecha,
  v.subtotal, v.iva, v.total, v.notas
`;

/**
 * Consolida líneas repetidas del mismo producto y las ordena por id.
 * El orden importa: bloquear siempre en la misma secuencia evita deadlocks
 * entre dos ventas simultáneas que toquen los mismos productos.
 */
function consolidarLineas(items) {
  const porProducto = new Map();

  for (const item of items) {
    const idProducto = Number(item.id_producto);
    const cantidad = Number(item.cantidad);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      throw { status: 400, message: 'Hay una línea con un producto inválido' };
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw { status: 400, message: 'Las cantidades deben ser enteros mayores que cero' };
    }

    porProducto.set(idProducto, (porProducto.get(idProducto) || 0) + cantidad);
  }

  return [...porProducto.entries()]
    .map(([id_producto, cantidad]) => ({ id_producto, cantidad }))
    .sort((a, b) => a.id_producto - b.id_producto);
}

async function crear({ id_cliente, notas, items }, id_usuario) {
  if (!id_cliente) throw { status: 400, message: 'Debes seleccionar un cliente' };
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'La venta debe tener al menos un producto' };
  }

  const lineas = consolidarLineas(items);
  const clienteDB = await pool.connect();

  try {
    await clienteDB.query('BEGIN');

    let subtotal = 0;
    const detalles = [];

    for (const linea of lineas) {
      const { rows } = await clienteDB.query(
        `SELECT id_producto, nombre, precio, stock, activo
           FROM producto WHERE id_producto = $1 FOR UPDATE`,
        [linea.id_producto]
      );
      const producto = rows[0];

      if (!producto) {
        throw { status: 404, message: `El producto ${linea.id_producto} no existe` };
      }
      if (!producto.activo) {
        throw { status: 409, message: `El producto ${producto.nombre} está inactivo` };
      }
      if (producto.stock < linea.cantidad) {
        throw {
          status: 409,
          message: `Stock insuficiente para ${producto.nombre} (disponible: ${producto.stock})`,
        };
      }

      // `pg` entrega DECIMAL como string: sin Number() esto concatenaría.
      const precio = Number(producto.precio);
      const subtotalLinea = Math.round(precio * linea.cantidad);
      subtotal += subtotalLinea;
      detalles.push({ ...linea, precio, subtotal: subtotalLinea });
    }

    const iva = Math.round(subtotal * IVA);
    const total = subtotal + iva;

    const { rows: [venta] } = await clienteDB.query(
      `INSERT INTO venta (id_cliente, id_usuario, subtotal, iva, total, notas)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_venta`,
      [id_cliente, id_usuario, subtotal, iva, total, notas || null]
    );

    for (const detalle of detalles) {
      await clienteDB.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [venta.id_venta, detalle.id_producto, detalle.cantidad, detalle.precio, detalle.subtotal]
      );

      // Reutiliza el servicio de productos pasándole el cliente de la
      // transacción. Devuelve undefined si el ajuste dejaría el stock negativo.
      const actualizado = await productosService.actualizarStock(
        detalle.id_producto, -detalle.cantidad, clienteDB
      );
      if (!actualizado) {
        throw { status: 409, message: `Stock insuficiente para el producto ${detalle.id_producto}` };
      }
    }

    await clienteDB.query('COMMIT');
    return obtenerPorId(venta.id_venta);
  } catch (error) {
    // El ROLLBACK va en su propio try para no tapar el error original.
    try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexión ya perdida */ }
    throw error;
  } finally {
    // Sin este release el pool se agota tras unas pocas ventas.
    clienteDB.release();
  }
}

async function obtenerTodas({ desde, hasta, id_cliente } = {}) {
  const condiciones = [];
  const valores = [];

  if (desde) { valores.push(desde); condiciones.push(`v.fecha >= $${valores.length}`); }
  if (hasta) { valores.push(hasta); condiciones.push(`v.fecha <= $${valores.length}`); }
  if (id_cliente) { valores.push(id_cliente); condiciones.push(`v.id_cliente = $${valores.length}`); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT ${COLUMNAS_VENTA},
            c.nombre AS cliente_nombre,
            u.nombre AS usuario_nombre
       FROM venta v
       LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
       LEFT JOIN usuario u ON u.id_usuario = v.id_usuario
       ${where}
      ORDER BY v.id_venta DESC`,
    valores
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const cabecera = await pool.query(
    `SELECT ${COLUMNAS_VENTA},
            c.nombre AS cliente_nombre,
            u.nombre AS usuario_nombre
       FROM venta v
       LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
       LEFT JOIN usuario u ON u.id_usuario = v.id_usuario
      WHERE v.id_venta = $1`,
    [id]
  );
  const venta = cabecera.rows[0];
  if (!venta) return undefined;

  const detalles = await pool.query(
    `SELECT dv.id_detalle, dv.id_producto, p.nombre AS producto_nombre, p.imagen,
            dv.cantidad, dv.precio_unitario, dv.subtotal
       FROM detalle_venta dv
       JOIN producto p ON p.id_producto = dv.id_producto
      WHERE dv.id_venta = $1
      ORDER BY dv.id_detalle`,
    [id]
  );

  return { ...venta, detalles: detalles.rows };
}

async function obtenerPorCliente(idCliente) {
  const result = await pool.query(
    `SELECT ${COLUMNAS_VENTA}
       FROM venta v
      WHERE v.id_cliente = $1
      ORDER BY v.id_venta DESC`,
    [idCliente]
  );
  return result.rows;
}

async function obtenerEstadisticas() {
  const result = await pool.query(`
    SELECT COUNT(*)::int                      AS total_ventas,
           COALESCE(SUM(total), 0)            AS ingresos,
           COALESCE(ROUND(AVG(total), 2), 0)  AS ticket_promedio
      FROM venta
  `);
  return result.rows[0];
}

async function obtenerRecientes(limite = 5) {
  const result = await pool.query(
    `SELECT ${COLUMNAS_VENTA}, c.nombre AS cliente_nombre
       FROM venta v
       LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
      ORDER BY v.id_venta DESC
      LIMIT $1`,
    [limite]
  );
  return result.rows;
}

// Resumen por cliente para el panel "Productos por Cliente" del dashboard.
// La subconsulta es obligatoria: unir venta con detalle_venta y sumar v.total
// multiplicaría el total por el número de líneas de cada venta.
async function obtenerResumenPorCliente() {
  const result = await pool.query(`
    SELECT c.id_cliente,
           c.nombre AS cliente_nombre,
           t.total_ventas,
           t.total_gastado,
           t.productos
      FROM cliente c
      JOIN (
        SELECT v.id_cliente,
               COUNT(*)::int AS total_ventas,
               SUM(v.total)  AS total_gastado,
               (SELECT STRING_AGG(x.nombre || ' (x' || x.cantidad || ')', ', ')
                  FROM (SELECT p.nombre, SUM(dv.cantidad)::int AS cantidad
                          FROM venta v2
                          JOIN detalle_venta dv ON dv.id_venta = v2.id_venta
                          JOIN producto p ON p.id_producto = dv.id_producto
                         WHERE v2.id_cliente = v.id_cliente
                         GROUP BY p.nombre) x) AS productos
          FROM venta v
         GROUP BY v.id_cliente
      ) t ON t.id_cliente = c.id_cliente
     ORDER BY t.total_gastado DESC
  `);
  return result.rows;
}

// Anular una venta devuelve el stock. Transacción espejo de crear().
async function eliminar(id) {
  const clienteDB = await pool.connect();

  try {
    await clienteDB.query('BEGIN');

    // Se bloquea la venta ANTES de leer sus líneas, para que otra anulación
    // simultánea no devuelva el stock dos veces.
    const { rowCount } = await clienteDB.query(
      'SELECT 1 FROM venta WHERE id_venta = $1 FOR UPDATE', [id]
    );
    if (!rowCount) throw { status: 404, message: 'Venta no encontrada' };

    const { rows: detalles } = await clienteDB.query(
      `SELECT id_producto, cantidad FROM detalle_venta
        WHERE id_venta = $1 ORDER BY id_producto`,
      [id]
    );

    for (const detalle of detalles) {
      const devuelto = await productosService.actualizarStock(
        detalle.id_producto, detalle.cantidad, clienteDB
      );
      if (!devuelto) {
        throw { status: 409, message: `No se pudo devolver el stock del producto ${detalle.id_producto}` };
      }
    }

    // detalle_venta tiene ON DELETE CASCADE, así que las líneas se van solas.
    await clienteDB.query('DELETE FROM venta WHERE id_venta = $1', [id]);
    await clienteDB.query('COMMIT');
  } catch (error) {
    try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexión ya perdida */ }
    throw error;
  } finally {
    clienteDB.release();
  }
}

module.exports = {
  crear, obtenerTodas, obtenerPorId, obtenerPorCliente,
  obtenerEstadisticas, obtenerRecientes, obtenerResumenPorCliente, eliminar,
  IVA,
};
