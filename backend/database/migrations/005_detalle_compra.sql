-- Una compra debe INCREMENTAR el stock, y una cabecera sin lineas no dice
-- de que producto. Por eso `detalle_compra` es obligatoria.
CREATE TABLE IF NOT EXISTS detalle_compra (
    id_detalle      SERIAL PRIMARY KEY,
    id_compra       INT REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto     INT REFERENCES producto(id_producto),
    cantidad        INT NOT NULL,
    -- Costo al proveedor: distinto de producto.precio, que es el de venta.
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);

ALTER TABLE compra ADD COLUMN IF NOT EXISTS notas TEXT;

CREATE INDEX IF NOT EXISTS idx_detalle_compra_compra ON detalle_compra (id_compra);
CREATE INDEX IF NOT EXISTS idx_compra_proveedor      ON compra (id_proveedor);
