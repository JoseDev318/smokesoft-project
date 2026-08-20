import type { Rol } from "@/shared/types/bd.types";

/**
 * Permisos derivados LITERALMENTE de los archivos de rutas del backend.
 *
 * El objetivo es que la interfaz nunca ofrezca un botón que va a responder 403.
 * Si cambia un `verificarRol` en el backend, hay que reflejarlo aquí.
 */

const ADMIN: Rol[] = ["Administrador"];
const INVENTARIO: Rol[] = ["Administrador", "Inventario"];
const VENTAS: Rol[] = ["Administrador", "Vendedor"];
const STAFF: Rol[] = ["Administrador", "Inventario", "Vendedor"];

export interface PermisoModulo {
  ver: Rol[];
  escribir: Rol[];
  borrar: Rol[];
}

export const PERMISOS = {
  // usuarios.routes.js: verificarRol('Administrador') en las 6 rutas
  usuarios: { ver: ADMIN, escribir: ADMIN, borrar: ADMIN },

  // productos.routes.js: lectura pública, escritura Admin/Inventario, borrado Admin
  productos: { ver: STAFF, escribir: INVENTARIO, borrar: ADMIN },

  // categorias.routes.js: igual que productos
  categorias: { ver: STAFF, escribir: INVENTARIO, borrar: ADMIN },

  // proveedores.routes.js: lectura de todo el personal, escritura Admin/Inventario
  proveedores: { ver: STAFF, escribir: INVENTARIO, borrar: ADMIN },

  // clientes.routes.js: Admin/Vendedor. 'Cliente' queda fuera a propósito:
  // expondría los datos de todos los demás compradores.
  clientes: { ver: VENTAS, escribir: VENTAS, borrar: ADMIN },

  // ventas.routes.js: Admin/Vendedor. Sin PUT: no existe en el backend.
  ventas: { ver: VENTAS, escribir: VENTAS, borrar: ADMIN },

  // compras.routes.js: Admin/Inventario
  compras: { ver: INVENTARIO, escribir: INVENTARIO, borrar: ADMIN },

  // productos /stock-bajo y PATCH /:id/stock
  inventario: { ver: INVENTARIO, escribir: INVENTARIO, borrar: [] as Rol[] },

  // El dashboard combina varias fuentes; lo ve todo el personal y cada panel
  // se muestra según sus propios permisos.
  dashboard: { ver: STAFF, escribir: [] as Rol[], borrar: [] as Rol[] },
} as const satisfies Record<string, PermisoModulo>;

export type ClaveModulo = keyof typeof PERMISOS;

export function puede(rol: Rol | undefined, modulo: ClaveModulo, accion: keyof PermisoModulo): boolean {
  if (!rol) return false;
  return (PERMISOS[modulo][accion] as readonly Rol[]).includes(rol);
}

export { ADMIN, INVENTARIO, VENTAS, STAFF };
