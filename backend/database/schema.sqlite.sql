-- ============================================
-- Base de datos SmokeSoft - SQLite (desarrollo local)
--
-- Espejo de schema.sql (PostgreSQL) para el driver por defecto en local/
-- develop. Si cambias una columna en uno, cámbiala también en el otro — ver
-- backend/src/config/db.sqlite.js para las diferencias de sintaxis toleradas
-- en tiempo de consulta (::casts, FOR UPDATE, STRING_AGG).
--
-- No lleva datos ni tabla de migraciones: al ser de solo desarrollo/pruebas,
-- `npm run seed` borra este archivo y lo vuelve a crear desde cero cada vez
-- (ver src/scripts/sqlite-reset.js), así que no hace falta un sistema
-- incremental como el de Postgres.
-- ============================================

CREATE TABLE categoria (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL,
    descripcion  TEXT
);

CREATE TABLE proveedor (
    id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL,
    telefono     TEXT,
    direccion    TEXT,
    correo       TEXT
);

CREATE TABLE producto (
    id_producto   INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT NOT NULL,
    descripcion   TEXT,
    precio        NUMERIC(10,2) NOT NULL,
    stock         INTEGER NOT NULL DEFAULT 0,
    id_categoria  INTEGER REFERENCES categoria(id_categoria),
    id_proveedor  INTEGER REFERENCES proveedor(id_proveedor),
    activo        INTEGER NOT NULL DEFAULT 1,   -- booleano: 0/1 (ver db.sqlite.js)
    stock_minimo  INTEGER NOT NULL DEFAULT 0,
    imagen        TEXT
);

CREATE TABLE cliente (
    id_cliente     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    correo         TEXT UNIQUE,
    telefono       TEXT,
    direccion      TEXT,
    tipo_documento TEXT,
    documento      TEXT
);

-- SQLite trata cada NULL como distinto de los demás en un índice UNIQUE
-- (igual que Postgres), así que varios clientes sin documento no chocan.
CREATE UNIQUE INDEX cliente_documento_key ON cliente (documento);

CREATE TABLE usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    usuario    TEXT UNIQUE NOT NULL,
    correo     TEXT UNIQUE,
    clave      TEXT NOT NULL,
    rol        TEXT NOT NULL,
    estado     INTEGER NOT NULL DEFAULT 1,      -- booleano: 0/1
    id_cliente INTEGER REFERENCES cliente(id_cliente)
);

CREATE UNIQUE INDEX usuario_id_cliente_key ON usuario (id_cliente);

CREATE TABLE compra (
    id_compra    INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha        TEXT NOT NULL DEFAULT (date('now')),
    id_proveedor INTEGER REFERENCES proveedor(id_proveedor),
    id_usuario   INTEGER REFERENCES usuario(id_usuario),
    total        NUMERIC(10,2) NOT NULL DEFAULT 0,
    notas        TEXT
);

CREATE TABLE detalle_compra (
    id_detalle      INTEGER PRIMARY KEY AUTOINCREMENT,
    id_compra       INTEGER REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto     INTEGER REFERENCES producto(id_producto),
    cantidad        INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal        NUMERIC(10,2) NOT NULL
);

CREATE TABLE venta (
    id_venta   INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER REFERENCES cliente(id_cliente),
    id_usuario INTEGER REFERENCES usuario(id_usuario),
    fecha      TEXT NOT NULL DEFAULT (date('now')),
    subtotal   NUMERIC(10,2) NOT NULL DEFAULT 0,
    iva        NUMERIC(10,2) NOT NULL DEFAULT 0,
    total      NUMERIC(10,2) NOT NULL DEFAULT 0,
    notas      TEXT
);

CREATE TABLE detalle_venta (
    id_detalle      INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta        INTEGER REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto     INTEGER REFERENCES producto(id_producto),
    cantidad        INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2),
    subtotal        NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_compra_proveedor      ON compra (id_proveedor);
CREATE INDEX idx_detalle_compra_compra ON detalle_compra (id_compra);
CREATE INDEX idx_venta_cliente         ON venta (id_cliente);
CREATE INDEX idx_venta_fecha           ON venta (fecha);
CREATE INDEX idx_detalle_venta_venta   ON detalle_venta (id_venta);
