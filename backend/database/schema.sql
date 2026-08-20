-- ============================================
-- Base de datos SmokeSoft - PostgreSQL
-- Basado en el Modelo Entidad-Relación del manual técnico
--
-- Este archivo es la definición AUTORITATIVA para instalaciones nuevas:
-- docker-compose lo monta en docker-entrypoint-initdb.d, que solo se dispara
-- sobre un volumen vacío. Para actualizar una base de datos YA CREADA usa
-- `npm run migrate` (ver database/migrations/).
-- ============================================

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT
);

CREATE TABLE proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    telefono     VARCHAR(20),
    direccion    VARCHAR(200),
    correo       VARCHAR(150)
);

CREATE TABLE producto (
    id_producto   SERIAL PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT,
    precio        DECIMAL(10,2) NOT NULL,
    stock         INT NOT NULL DEFAULT 0,
    id_categoria  INT REFERENCES categoria(id_categoria),
    id_proveedor  INT REFERENCES proveedor(id_proveedor),
    activo        BOOLEAN NOT NULL DEFAULT true,
    stock_minimo  INT NOT NULL DEFAULT 0,
    imagen        VARCHAR(255)   -- nombre de archivo, ej: 'vaper.webp' (no bytes)
);

CREATE TABLE cliente (
    id_cliente     SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    correo         VARCHAR(150) UNIQUE,
    telefono       VARCHAR(20),
    direccion      VARCHAR(200),
    tipo_documento VARCHAR(5),    -- 'CC', 'TI', 'CE'
    documento      VARCHAR(30)
);

-- UNIQUE tolera múltiples NULL en PostgreSQL, así que el personal puede crear
-- clientes de mostrador sin documento sin romper la restricción.
CREATE UNIQUE INDEX cliente_documento_key ON cliente (documento);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre     VARCHAR(150) NOT NULL,
    usuario    VARCHAR(50) UNIQUE NOT NULL,
    correo     VARCHAR(150) UNIQUE,
    clave      VARCHAR(255) NOT NULL,   -- se guarda un hash (bcrypt), nunca la clave real
    rol        VARCHAR(50) NOT NULL,    -- 'Administrador', 'Vendedor', 'Inventario', 'Cliente'
    estado     BOOLEAN NOT NULL DEFAULT true,
    -- Una cuenta de tienda (rol='Cliente') apunta a su ficha en `cliente`.
    -- Los usuarios del personal dejan esto en NULL.
    id_cliente INT REFERENCES cliente(id_cliente)
);

CREATE UNIQUE INDEX usuario_id_cliente_key ON usuario (id_cliente);

CREATE TABLE compra (
    id_compra    SERIAL PRIMARY KEY,
    fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
    id_proveedor INT REFERENCES proveedor(id_proveedor),
    id_usuario   INT REFERENCES usuario(id_usuario),
    total        DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas        TEXT
);

CREATE TABLE detalle_compra (
    id_detalle      SERIAL PRIMARY KEY,
    id_compra       INT REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto     INT REFERENCES producto(id_producto),
    cantidad        INT NOT NULL,
    -- Costo al proveedor: distinto de producto.precio, que es el de venta.
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);

CREATE TABLE venta (
    id_venta   SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES cliente(id_cliente),
    id_usuario INT REFERENCES usuario(id_usuario),
    fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
    -- El IVA se ALMACENA, no se recalcula al leer: la tasa cambia por ley y
    -- recalcular reescribiría facturas históricas.
    subtotal   DECIMAL(10,2) NOT NULL DEFAULT 0,
    iva        DECIMAL(10,2) NOT NULL DEFAULT 0,
    total      DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas      TEXT
);

CREATE TABLE detalle_venta (
    id_detalle      SERIAL PRIMARY KEY,
    id_venta        INT REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto     INT REFERENCES producto(id_producto),
    cantidad        INT NOT NULL,
    -- Congela el precio histórico: si el producto cambia de precio mañana,
    -- la factura de ayer no se reescribe.
    precio_unitario DECIMAL(10,2),
    subtotal        DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_compra_proveedor      ON compra (id_proveedor);
CREATE INDEX idx_detalle_compra_compra ON detalle_compra (id_compra);
CREATE INDEX idx_venta_cliente         ON venta (id_cliente);
CREATE INDEX idx_venta_fecha           ON venta (fecha);
CREATE INDEX idx_detalle_venta_venta   ON detalle_venta (id_venta);

-- ============================================
-- Control de migraciones
-- Este archivo ya trae el esquema final, así que las migraciones 001-005 se
-- marcan como aplicadas para que `npm run migrate` no intente re-ejecutarlas.
-- ============================================
CREATE TABLE schema_migrations (
    nombre      VARCHAR(255) PRIMARY KEY,
    aplicada_en TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (nombre) VALUES
    ('001_producto_imagen.sql'),
    ('002_cliente_documento.sql'),
    ('003_usuario_cliente_link.sql'),
    ('004_venta_totales.sql'),
    ('005_detalle_compra.sql');

-- ============================================
-- Datos iniciales (usuario administrador de prueba)
-- La clave real es "admin123", ya viene encriptada con bcrypt.
-- Si el login falla, genera tu propio hash en Node con:
--   node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
-- y reemplaza el valor de abajo.
-- ============================================
INSERT INTO usuario (nombre, usuario, correo, clave, rol, estado)
VALUES (
    'Administrador',
    'admin',
    'admin@smokesoft.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0uJ8bJ5s7CBHnwB.jsC3VqLmvkKPd7CzS', -- reemplázalo por tu propio hash
    'Administrador',
    true
);
