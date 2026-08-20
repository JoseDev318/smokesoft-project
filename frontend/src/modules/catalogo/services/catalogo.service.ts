import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { CategoriaFila, ProductoFila } from "@/shared/types/bd.types";

/**
 * Lecturas del catálogo público.
 *
 * Todas van con `publico: true`: estos GET no exigen token (se abrieron en el
 * backend justamente para esto), y esa marca es la que permite llamarlas desde
 * un componente de servidor, donde no hay cookies del navegador.
 */

const REVALIDAR = 60; // segundos de caché en las páginas RSC

export const catalogoService = {
  listarProductos: () =>
    api.get<ProductoFila[]>(ENDPOINTS.productos.lista, {
      publico: true,
      revalidate: REVALIDAR,
    }),

  listarCategorias: () =>
    api.get<CategoriaFila[]>(ENDPOINTS.categorias.lista, {
      publico: true,
      revalidate: REVALIDAR,
    }),

  obtenerProducto: (id: number) =>
    api.get<ProductoFila>(ENDPOINTS.productos.uno(id), {
      publico: true,
      revalidate: REVALIDAR,
    }),
};
