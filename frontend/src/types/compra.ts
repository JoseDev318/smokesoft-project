export type Compra = {
  id_compra: number;
  fecha: string;
  id_proveedor: number;
  nombre_proveedor: string;
  id_usuario: number;
  total: string;
};

export type DetalleCompra = {
  id_detalle: number;
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  subtotal: string;
};

export type CompraConDetalle = Compra & {
  detalle: DetalleCompra[];
};

// Lo que arma el formulario antes de enviarlo
export type LineaCompra = {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
};