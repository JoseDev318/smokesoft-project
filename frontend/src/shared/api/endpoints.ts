/**
 * Catálogo único de rutas de la API.
 *
 * Tenerlas en un solo objeto evita la clase de bug "/api/productos" vs
 * "/api/producto" y, sobre todo, hace auditable qué endpoints son públicos:
 * la marca `publico` de abajo es la que decide si el wrapper adjunta el token.
 */

export const ENDPOINTS = {
  health: "/health",

  auth: {
    login: "/auth/login",
    registro: "/auth/registro",
    me: "/auth/me",
  },

  usuarios: {
    lista: "/usuarios",
    uno: (id: number) => `/usuarios/${id}`,
    estado: (id: number) => `/usuarios/${id}/estado`,
  },

  productos: {
    lista: "/productos",
    uno: (id: number) => `/productos/${id}`,
    stockBajo: "/productos/stock-bajo",
    resumen: "/productos/resumen",
    estado: (id: number) => `/productos/${id}/estado`,
    stock: (id: number) => `/productos/${id}/stock`,
  },

  categorias: {
    lista: "/categorias",
    uno: (id: number) => `/categorias/${id}`,
  },

  proveedores: {
    lista: "/proveedores",
    uno: (id: number) => `/proveedores/${id}`,
  },

  clientes: {
    lista: "/clientes",
    uno: (id: number) => `/clientes/${id}`,
    ventasDe: (id: number) => `/clientes/${id}/ventas`,
    mio: "/clientes/mio",
    misVentas: "/clientes/mio/ventas",
  },

  ventas: {
    lista: "/ventas",
    uno: (id: number) => `/ventas/${id}`,
    estadisticas: "/ventas/estadisticas",
    recientes: "/ventas/recientes",
    porCliente: "/ventas/por-cliente",
    mias: "/ventas/mias",
    miaUna: (id: number) => `/ventas/mias/${id}`,
  },

  compras: {
    lista: "/compras",
    uno: (id: number) => `/compras/${id}`,
    estadisticas: "/compras/estadisticas",
  },
} as const;
