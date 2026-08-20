-- Guarda el nombre del archivo de imagen (ej: 'vaper.webp'), no los bytes.
-- El frontend lo resuelve contra /img/productos/<imagen>.
ALTER TABLE producto ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);
