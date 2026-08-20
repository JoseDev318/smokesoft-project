"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { aNumero } from "@/shared/lib/dinero";
import type {
  CategoriaFila, ProductoFila, ProductoVista,
} from "@/shared/types/bd.types";
import { catalogoService } from "../services/catalogo.service";

export const CLAVES_CATALOGO = {
  productos: ["catalogo", "productos"] as const,
  categorias: ["catalogo", "categorias"] as const,
};

/**
 * Productos y categorías del catálogo.
 *
 * `initialData` viene del componente de servidor, así la página se pinta al
 * instante y aun así se refresca en cliente.
 */
export function useCatalogo(
  productosIniciales?: ProductoFila[],
  categoriasIniciales?: CategoriaFila[]
) {
  const productos = useQuery({
    queryKey: CLAVES_CATALOGO.productos,
    queryFn: catalogoService.listarProductos,
    initialData: productosIniciales,
  });

  const categorias = useQuery({
    queryKey: CLAVES_CATALOGO.categorias,
    queryFn: catalogoService.listarCategorias,
    initialData: categoriasIniciales,
  });

  // El backend devuelve id_categoria crudo, sin join. El nombre se resuelve
  // aquí, y la caché compartida de react-query hace que la lista de categorías
  // se pida una sola vez para toda la aplicación.
  const enriquecidos = useMemo(
    () => enriquecer(productos.data ?? [], categorias.data ?? []),
    [productos.data, categorias.data]
  );

  return {
    productos: enriquecidos,
    categorias: categorias.data ?? [],
    cargando: productos.isLoading || categorias.isLoading,
    error: productos.error ?? categorias.error,
    recargar: () => { void productos.refetch(); void categorias.refetch(); },
  };
}

/** Añade los nombres de las relaciones y los valores derivados. */
export function enriquecer(
  productos: ProductoFila[],
  categorias: CategoriaFila[],
  proveedores: { id_proveedor: number; nombre: string }[] = []
): ProductoVista[] {
  const porCategoria = new Map(categorias.map((c) => [c.id_categoria, c.nombre]));
  const porProveedor = new Map(proveedores.map((p) => [p.id_proveedor, p.nombre]));

  return productos.map((producto) => ({
    ...producto,
    // Una sola conversión del Decimal string, aquí y no en cada render.
    precioNum: aNumero(producto.precio),
    categoriaNombre: producto.id_categoria
      ? porCategoria.get(producto.id_categoria) ?? "Sin categoría"
      : "Sin categoría",
    proveedorNombre: producto.id_proveedor
      ? porProveedor.get(producto.id_proveedor) ?? "Sin proveedor"
      : "Sin proveedor",
    stockBajo: producto.stock <= producto.stock_minimo,
    sinExistencias: producto.stock <= 0,
  }));
}
