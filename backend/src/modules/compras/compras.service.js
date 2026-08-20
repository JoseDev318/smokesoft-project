const pool = require('../../config/db');
const productosService = require('../productos/productos.service');

// `fecha::text` para que `pg` no la convierta a Date y JSON no la serialice como
// timestamp UTC (en UTC-5 mostraría el día anterior).
const COLUMNAS_COMPRA = `
  c.id_compra, c.id_proveedor, c.id_usuario, c.fecha::text AS fecha,
  c.total, c.notas
`;

/**
 * A diferencia de una venta, aquí el precio SÍ lo manda el cliente: es el costo
 * que fija el proveedor, y no tiene nada que ver con producto.precio (que es el
 * de venta al público).
 *
 * Se ordena por id_producto por la misma razón que en ventas: bloquear siempre
 * en la misma secuencia evita deadlocks entre operaciones simultáneas.
 */
function consolidarLineas(items) {
  const porProducto = new Map();

  for (const item of items) {
    const idProducto = Number(item.id_producto);
    const cantidad = Number(item.cantidad);
    const precio = Number(item.precio_unitario);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      throw { status: 400, message: 'Hay una línea con un producto inválido' };
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw { status: 400, message: 'Las cantidades deben ser enteros mayores que cero' };
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      throw { status: 400, message: 'El costo unitario debe ser un número mayor que cero' };
    }

    const previo = porProducto.get(idProducto);
    if (previo) {
      previo.cantidad += cantidad;
      // Si la misma factura repite el producto a distinto costo, se conserva el
      // último indicado.
      previo.precio_unitario = precio;
    } else {
      porProducto.set(idProducto, { id_producto: idProducto, cantidad, precio_unitario: precio });
    }
  }

  return [...porProducto.values()].sort((a, b) => a.id_producto - b.id_producto);
}

async function crear({ id_proveedor, notas, items }, id_usuario) {
  if (!id_proveedor) throw { status: 400, message: 'Debes seleccionar un proveedor' };
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'La compra debe tener al menos un producto' };
  }

  const lineas = consolidarLineas(items);
  const clienteDB = await pool.connect();

  try {
    await clienteDB.query('BEGIN');

    let total = 0;
    const detalles = [];

    for (const linea of lineas) {
      const { rows } = await clienteDB.query(
        'SELECT id_producto, nombre FROM producto WHERE id_producto = $1 FOR UPDATE',
        [linea.id_producto]
      );
      if (!rows[0]) {
        throw { status: 404, message: `El producto ${linea.id_producto} no existe` };
      }

      // No se valida stock: una compra solo puede aumentarlo.
      const subtotal = Math.round(linea.precio_unitario * linea.cantidad);
      total += subtotal;
      detalles.push({ ...linea, subtotal });
    }

    // Sin IVA: el tratamiento fiscal de una factura de proveedor es otro asunto
    // y la tabla `compra` no tiene dónde guardarlo.
    const { rows: [compra] } = await clienteDB.query(
      `INSERT INTO compra (id_proveedor, id_usuario, total, notas)
       VALUES ($1, $2, $3, $4) RETURNING id_compra`,
      [id_proveedor, id_usuario, total, notas || null]
    );

    for (const detalle of detalles) {
      await clienteDB.query(
        `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [compra.id_compra, detalle.id_producto, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
      );

      // Delta positivo: entrada de mercancía.
      const actualizado = await productosService.actualizarStock(
        detalle.id_producto, detalle.cantidad, clienteDB
      );
      if (!actualizado) {
        throw { status: 409, message: `No se pudo actualizar el stock del producto ${detalle.id_producto}` };
      }
    }

    await clienteDB.query('COMMIT');
    return obtenerPorId(compra.id_compra);
  } catch (error) {
    try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexión ya perdida */ }
    throw error;
  } finally {
    clienteDB.release();
  }
}

async function obtenerTodas() {
  const result = await pool.query(
    `SELECT ${COLUMNAS_COMPRA},
            pr.nombre AS proveedor_nombre,
            u.nombre  AS usuario_nombre
       FROM compra c
       LEFT JOIN proveedor pr ON pr.id_proveedor = c.id_proveedor
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
      ORDER BY c.id_compra DESC`
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const cabecera = await pool.query(
    `SELECT ${COLUMNAS_COMPRA},
            pr.nombre AS proveedor_nombre,
            u.nombre  AS usuario_nombre
       FROM compra c
       LEFT JOIN proveedor pr ON pr.id_proveedor = c.id_proveedor
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE c.id_compra = $1`,
    [id]
  );
  const compra = cabecera.rows[0];
  if (!compra) return undefined;

  const detalles = await pool.query(
    `SELECT dc.id_detalle, dc.id_producto, p.nombre AS producto_nombre,
            dc.cantidad, dc.precio_unitario, dc.subtotal
       FROM detalle_compra dc
       JOIN producto p ON p.id_producto = dc.id_producto
      WHERE dc.id_compra = $1
      ORDER BY dc.id_detalle`,
    [id]
  );

  return { ...compra, detalles: detalles.rows };
}

async function obtenerEstadisticas() {
  const result = await pool.query(`
    SELECT COUNT(*)::int           AS total_compras,
           COALESCE(SUM(total), 0) AS egresos
      FROM compra
  `);
  return result.rows[0];
}

// Anular una compra RESTA stock, así que puede fallar legítimamente si la
// mercancía ya se vendió: el guard de actualizarStock lo rechaza.
async function eliminar(id) {
  const clienteDB = await pool.connect();

  try {
    await clienteDB.query('BEGIN');

    const { rowCount } = await clienteDB.query(
      'SELECT 1 FROM compra WHERE id_compra = $1 FOR UPDATE', [id]
    );
    if (!rowCount) throw { status: 404, message: 'Compra no encontrada' };

    const { rows: detalles } = await clienteDB.query(
      `SELECT id_producto, cantidad FROM detalle_compra
        WHERE id_compra = $1 ORDER BY id_producto`,
      [id]
    );

    for (const detalle of detalles) {
      const revertido = await productosService.actualizarStock(
        detalle.id_producto, -detalle.cantidad, clienteDB
      );
      if (!revertido) {
        throw {
          status: 409,
          message: 'No se puede anular la compra: el stock ya fue vendido',
        };
      }
    }

    // detalle_compra tiene ON DELETE CASCADE.
    await clienteDB.query('DELETE FROM compra WHERE id_compra = $1', [id]);
    await clienteDB.query('COMMIT');
  } catch (error) {
    try { await clienteDB.query('ROLLBACK'); } catch (_) { /* conexión ya perdida */ }
    throw error;
  } finally {
    clienteDB.release();
  }
}

module.exports = {
  crear, obtenerTodas, obtenerPorId, obtenerEstadisticas, eliminar,
};
