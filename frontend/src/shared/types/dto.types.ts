/**
 * Payloads que se ENVÍAN al backend.
 *
 * Regla que atraviesa todo este archivo: los PUT del backend son REEMPLAZO
 * TOTAL. Sus servicios destructuran el body posicionalmente hacia el SQL, así
 * que un campo omitido llega como `undefined` y se guarda como NULL, borrando
 * la columna en silencio.
 *
 * Por eso aquí no hay ningún `Partial<>`: todos los campos actualizables son
 * obligatorios, y el tipo obliga a mandar el objeto completo.
 */

import type { Rol } from "./bd.types";

export interface LoginDto {
  usuario: string;
  clave: string;
}

/** POST /api/auth/registro — alta pública de cliente. */
export interface RegistroClienteDto {
  nombre: string;
  apellidos: string;
  correo: string;
  usuario: string;
  clave: string;
  tipo_documento: string;
  documento: string;
  celular: string;
  direccion?: string;
}

export interface CrearUsuarioDto {
  nombre: string;
  usuario: string;
  correo: string | null;
  clave: string;
  rol: Rol;
}

/** El PUT de usuarios solo toca estos tres campos; `usuario` y `clave` no. */
export interface ActualizarUsuarioDto {
  nombre: string;
  correo: string | null;
  rol: Rol;
}

export interface CategoriaDto {
  nombre: string;
  descripcion: string | null;
}

export interface ProveedorDto {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  correo: string | null;
}

export interface ClienteDto {
  nombre: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_documento: string | null;
  documento: string | null;
}

export interface CrearProductoDto {
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  stock_minimo: number;
  id_categoria: number | null;
  id_proveedor: number | null;
  imagen: string | null;
}

/**
 * El PUT de productos NO actualiza `stock` a propósito: el inventario se mueve
 * por PATCH /:id/stock o por una venta/compra, para que guardar el formulario
 * no pise la existencia real.
 */
export type ActualizarProductoDto = Omit<CrearProductoDto, "stock">;

export interface LineaVentaDto {
  id_producto: number;
  cantidad: number;
  // Sin precio: el backend lo lee de la base de datos, así que el cliente no
  // puede manipularlo.
}

export interface CrearVentaDto {
  id_cliente: number;
  notas: string | null;
  items: LineaVentaDto[];
}

export interface LineaCompraDto {
  id_producto: number;
  cantidad: number;
  // Aquí el precio SÍ lo manda el cliente: es el costo que fija el proveedor,
  // distinto del precio de venta al público.
  precio_unitario: number;
}

export interface CrearCompraDto {
  id_proveedor: number;
  notas: string | null;
  items: LineaCompraDto[];
}

/** `cantidad` es un delta con signo: negativo descuenta. */
export interface AjusteStockDto {
  cantidad: number;
  motivo?: string;
}
