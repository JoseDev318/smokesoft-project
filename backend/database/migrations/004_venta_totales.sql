-- El IVA se ALMACENA, no se recalcula al leer: la tasa cambia por ley y
-- recalcular reescribiria facturas historicas. Ademas el redondeo de JS y el
-- de Postgres discrepan en los medios, y el total mostrado dejaria de cuadrar
-- con el guardado.
ALTER TABLE venta ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE venta ADD COLUMN IF NOT EXISTS iva      DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE venta ADD COLUMN IF NOT EXISTS notas    TEXT;

-- Congela el precio historico: si el producto cambia de precio manana,
-- la factura de ayer no se reescribe.
ALTER TABLE detalle_venta ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_venta_cliente       ON venta (id_cliente);
CREATE INDEX IF NOT EXISTS idx_venta_fecha         ON venta (fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta ON detalle_venta (id_venta);

-- Relleno para filas anteriores a la migracion (no-op en una tabla vacia).
UPDATE detalle_venta
   SET precio_unitario = ROUND(subtotal / NULLIF(cantidad, 0), 2)
 WHERE precio_unitario IS NULL;

UPDATE venta SET subtotal = total, iva = 0 WHERE subtotal = 0 AND total > 0;
