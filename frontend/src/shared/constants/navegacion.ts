import type { ClaveModulo } from "@/modules/auth/constants/roles";
import { RUTAS } from "./rutas";

export interface ItemNavPublica {
  etiqueta: string;
  href: string;
}

/** Menú del shell público. "Administración" apunta al panel; el middleware
 *  desvía a /ingresar a quien no tenga sesión. */
export const NAV_PUBLICA: ItemNavPublica[] = [
  { etiqueta: "Inicio", href: RUTAS.inicio },
  { etiqueta: "Productos", href: RUTAS.productos },
  { etiqueta: "Contáctenos", href: RUTAS.contactenos },
  { etiqueta: "Administración", href: RUTAS.panel },
];

export interface ItemSidebar {
  etiqueta: string;
  href: string;
  icono: string;
  /** Módulo cuyo permiso `ver` decide si el ítem aparece. */
  permiso: ClaveModulo;
}

/**
 * Menú del panel. Los iconos son emoji, igual que en el guía.
 * `permiso` se cruza con PERMISOS para que nadie vea una sección que le va a
 * responder 403.
 */
export const NAV_PANEL: ItemSidebar[] = [
  { etiqueta: "Dashboard", href: RUTAS.panel, icono: "📊", permiso: "dashboard" },
  { etiqueta: "Usuarios", href: RUTAS.panelUsuarios, icono: "👤", permiso: "usuarios" },
  { etiqueta: "Clientes", href: RUTAS.panelClientes, icono: "👥", permiso: "clientes" },
  { etiqueta: "Proveedores", href: RUTAS.panelProveedores, icono: "🏭", permiso: "proveedores" },
  { etiqueta: "Categorías", href: RUTAS.panelCategorias, icono: "🏷️", permiso: "categorias" },
  { etiqueta: "Productos", href: RUTAS.panelProductos, icono: "📦", permiso: "productos" },
  { etiqueta: "Inventario", href: RUTAS.panelInventario, icono: "📋", permiso: "inventario" },
  { etiqueta: "Ventas", href: RUTAS.panelVentas, icono: "🛒", permiso: "ventas" },
  { etiqueta: "Compras", href: RUTAS.panelCompras, icono: "🚚", permiso: "compras" },
];

/** Barra de servicios de la zona de cliente (la del guía). */
export const SERVICIOS = [
  { icono: "✔", titulo: "Atención personalizada", detalle: "Servicio profesional" },
  { icono: "🔒", titulo: "Pagos seguros", detalle: "Bold / Nequi / Bancolombia / PSE" },
  { icono: "📦", titulo: "Productos", detalle: "100% Garantizados" },
  { icono: "🚚", titulo: "Programa tu entrega", detalle: "Envíos confiables" },
] as const;
