-- El formulario de "Crear Cuenta" pide tipo y numero de documento.
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(5);
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS documento VARCHAR(30);

-- UNIQUE tolera multiples NULL en PostgreSQL, asi que los clientes creados
-- por el personal (sin documento) no compiten por el indice.
CREATE UNIQUE INDEX IF NOT EXISTS cliente_documento_key ON cliente (documento);
