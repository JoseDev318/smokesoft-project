-- ============================================
-- Base de datos SmokeSoft - PostgreSQL
-- Basado en el Modelo Entidad-Relación del manual técnico
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
    stock_minimo  INT NOT NULL DEFAULT 0
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre     VARCHAR(150) NOT NULL,
    correo     VARCHAR(150) UNIQUE,
    telefono   VARCHAR(20),
    direccion  VARCHAR(200)
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre     VARCHAR(150) NOT NULL,
    usuario    VARCHAR(50) UNIQUE NOT NULL,
    correo     VARCHAR(150) UNIQUE,
    clave      VARCHAR(255) NOT NULL,   -- se guarda un hash (bcrypt), nunca la clave real
    rol        VARCHAR(50) NOT NULL,    -- 'Administrador', 'Vendedor', 'Inventario', etc.
    estado     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE compra (
    id_compra    SERIAL PRIMARY KEY,
    fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
    id_proveedor INT REFERENCES proveedor(id_proveedor),
    id_usuario   INT REFERENCES usuario(id_usuario),
    total        DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE venta (
    id_venta   SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES cliente(id_cliente),
    id_usuario INT REFERENCES usuario(id_usuario),
    fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
    total      DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE detalle_venta (
    id_detalle  SERIAL PRIMARY KEY,
    id_venta    INT REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto),
    cantidad    INT NOT NULL,
    subtotal    DECIMAL(10,2) NOT NULL
);

-- ============================================
-- Datos iniciales (usuario administrador de prueba)
-- La clave real es "admin123", ya viene encriptada con bcrypt.
-- Genera tu propio hash en Node con:
--   node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
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
