import type { Decimal } from "@/shared/types/bd.types";

/**
 * Línea del carrito.
 *
 * Guarda una FOTO del precio y del stock del momento en que se agregó, no una
 * referencia al producto. Así un cambio de precio a mitad de sesión no altera
 * el carrito en silencio; al hacer checkout se vuelve a consultar y se avisa si
 * algo se movió.
 */
export interface LineaCarrito {
  id_producto: number;
  nombre: string;
  /** Precio en el momento de agregar, en el mismo formato que llega del backend. */
  precio: Decimal;
  imagen: string | null;
  cantidad: number;
  /** Existencias conocidas al agregar, para limitar el selector de cantidad. */
  stockConocido: number;
}
