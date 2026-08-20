-- Una cuenta de tienda es una fila en `usuario` con rol='Cliente' que apunta
-- a su ficha en `cliente`. Los usuarios del personal dejan id_cliente en NULL.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS id_cliente INT REFERENCES cliente(id_cliente);

-- Un cliente puede tener como maximo una cuenta. Los NULL del personal
-- no compiten por el indice.
CREATE UNIQUE INDEX IF NOT EXISTS usuario_id_cliente_key ON usuario (id_cliente);
