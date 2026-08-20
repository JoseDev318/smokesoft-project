/** Línea editable de un formulario de venta o compra. */
export interface LineaEditable {
  /** Cadena vacía = fila recién añadida, sin producto elegido todavía. */
  id_producto: number | "";
  cantidad: number;
  /**
   * En una VENTA lo fija el precio del producto (solo lectura): el backend lo
   * lee de la base de datos, así que un valor distinto aquí no serviría de nada.
   * En una COMPRA es editable: es el costo que pone el proveedor.
   */
  precio_unitario: number;
}

export type ModoLineas = "venta" | "compra";

export function lineaVacia(): LineaEditable {
  return { id_producto: "", cantidad: 1, precio_unitario: 0 };
}
