/** Rutas de la aplicación en un solo sitio, para no repetir strings sueltos. */

export const RUTAS = {
  inicio: "/",
  productos: "/productos",
  producto: (id: number | string) => `/productos/${id}`,
  contactenos: "/contactenos",
  ingresar: "/ingresar",
  crearCuenta: "/crear-cuenta",

  carrito: "/carrito",
  checkout: "/carrito/checkout",
  confirmacion: (idVenta: number | string) => `/carrito/confirmacion/${idVenta}`,

  perfil: "/perfil",
  misPedidos: "/perfil/pedidos",
  miPedido: (id: number | string) => `/perfil/pedidos/${id}`,
  misDatos: "/perfil/datos",

  panel: "/panel",
  panelUsuarios: "/panel/usuarios",
  panelClientes: "/panel/clientes",
  panelProveedores: "/panel/proveedores",
  panelCategorias: "/panel/categorias",
  panelProductos: "/panel/productos",
  panelInventario: "/panel/inventario",
  panelVentas: "/panel/ventas",
  panelVentaNueva: "/panel/ventas/nueva",
  panelVenta: (id: number | string) => `/panel/ventas/${id}`,
  panelCompras: "/panel/compras",
  panelCompraNueva: "/panel/compras/nueva",
  panelCompra: (id: number | string) => `/panel/compras/${id}`,
} as const;

/** Construye la URL de ingreso conservando a dónde quería ir el visitante. */
export function rutaIngresar(siguiente?: string, motivo?: "expirada"): string {
  const params = new URLSearchParams();
  if (siguiente) params.set("siguiente", siguiente);
  if (motivo) params.set("motivo", motivo);
  const query = params.toString();
  return query ? `${RUTAS.ingresar}?${query}` : RUTAS.ingresar;
}

/** Imagen de un producto, con respaldo cuando no tiene una asignada. */
export function urlImagenProducto(imagen: string | null | undefined): string | null {
  if (!imagen) return null;
  // Si se guardó una URL absoluta, se usa tal cual.
  if (/^https?:\/\//.test(imagen)) return imagen;
  return `/img/productos/${imagen}`;
}
