/**
 * Filas tal como las devuelve el backend. Un espejo del esquema de Postgres,
 * sin adornos: lo que llega por el cable.
 */

export type Rol = "Administrador" | "Inventario" | "Vendedor" | "Cliente";

export const ROLES_STAFF: Rol[] = ["Administrador", "Inventario", "Vendedor"];

/**
 * DECIMAL / NUMERIC de Postgres.
 *
 * `pg` NO los convierte: llegan como string ("12.50"). Nunca hacer aritmética
 * directa sobre este tipo — usar `aNumero()` de shared/lib/dinero.ts.
 * El alias existe justamente para que el tipo grite en el sitio de uso.
 */
export type Decimal = string;

/**
 * DATE de Postgres.
 *
 * Los endpoints nuevos lo devuelven como "2026-08-20" gracias a `fecha::text`.
 * Formatear con `formatearFecha()` de shared/lib/fechas.ts, nunca con
 * `toLocaleDateString()` directo: en UTC-5 mostraría el día anterior.
 */
export type FechaISO = string;

export interface UsuarioFila {
  id_usuario: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  rol: Rol;
  estado: boolean;
  // `clave` nunca viaja: el backend la excluye de todos los SELECT.
}

export interface CategoriaFila {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
}

export interface ProveedorFila {
  id_proveedor: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  correo: string | null;
}

export interface ClienteFila {
  id_cliente: number;
  nombre: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_documento: string | null;
  documento: string | null;
}

export interface ProductoFila {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: Decimal;              // "12.50", no 12.5
  stock: number;                // INT: número real
  id_categoria: number | null;  // FK cruda: el backend no hace join
  id_proveedor: number | null;
  activo: boolean;              // BOOLEAN: booleano real
  stock_minimo: number;
  imagen: string | null;        // nombre de archivo, ej: "vaper.webp"
}

export interface ResumenProductos {
  total: number;
  activos: number;
  existencias: number;
  stock_bajo: number;
}

export interface DetalleVentaFila {
  id_detalle: number;
  id_producto: number;
  producto_nombre: string;
  imagen: string | null;
  cantidad: number;
  precio_unitario: Decimal;
  subtotal: Decimal;
}

export interface VentaFila {
  id_venta: number;
  id_cliente: number | null;
  id_usuario: number | null;
  fecha: FechaISO;
  subtotal: Decimal;
  iva: Decimal;
  total: Decimal;
  notas: string | null;
  cliente_nombre?: string | null;
  usuario_nombre?: string | null;
}

export interface VentaDetallada extends VentaFila {
  detalles: DetalleVentaFila[];
}

export interface DetalleCompraFila {
  id_detalle: number;
  id_producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: Decimal;
  subtotal: Decimal;
}

export interface CompraFila {
  id_compra: number;
  id_proveedor: number | null;
  id_usuario: number | null;
  fecha: FechaISO;
  total: Decimal;
  notas: string | null;
  proveedor_nombre?: string | null;
  usuario_nombre?: string | null;
}

export interface CompraDetallada extends CompraFila {
  detalles: DetalleCompraFila[];
}

export interface EstadisticasVentas {
  total_ventas: number;
  ingresos: Decimal;
  ticket_promedio: Decimal;
}

export interface EstadisticasCompras {
  total_compras: number;
  egresos: Decimal;
}

export interface ResumenPorCliente {
  id_cliente: number;
  cliente_nombre: string;
  total_ventas: number;
  total_gastado: Decimal;
  productos: string | null;   // "Encendedor (x3), Papel RAW (x2)"
}

/** Lo que devuelve GET /api/auth/me. */
export interface SesionCompleta {
  id_usuario: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  rol: Rol;
  estado: boolean;
  id_cliente: number | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_direccion: string | null;
  cliente_documento: string | null;
}

/* ---------- Tipos derivados en cliente ----------
   El backend devuelve las FK crudas sin join, así que los nombres de categoría
   y proveedor se resuelven en el navegador. */

export interface ProductoVista extends ProductoFila {
  precioNum: number;
  categoriaNombre: string;
  proveedorNombre: string;
  stockBajo: boolean;
  sinExistencias: boolean;
}
