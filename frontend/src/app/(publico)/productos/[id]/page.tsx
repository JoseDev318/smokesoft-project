import { notFound } from "next/navigation";

import { catalogoService } from "@/modules/catalogo/services/catalogo.service";
import { VistaProductoDetalle } from "@/modules/catalogo/views/VistaProductoDetalle";
import { ErrorNoEncontrado } from "@/shared/api/errores";
import type { CategoriaFila } from "@/shared/types/bd.types";

export const revalidate = 60;

// En Next 16 los params de una ruta dinámica son una promesa.
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  const producto = await catalogoService
    .obtenerProducto(Number(id))
    .catch((error: unknown) => {
      // El backend responde 404 también cuando el producto está inactivo y
      // quien pregunta es anónimo, que es exactamente lo que queremos aquí.
      if (error instanceof ErrorNoEncontrado) notFound();
      throw error;
    });

  // El producto trae `id_categoria` crudo, sin join: el nombre se resuelve
  // contra la lista de categorías.
  let categoria: CategoriaFila | null = null;
  if (producto.id_categoria) {
    try {
      const categorias = await catalogoService.listarCategorias();
      categoria = categorias.find((c) => c.id_categoria === producto.id_categoria) ?? null;
    } catch {
      // El nombre de la categoría es información secundaria: si falla, la ficha
      // del producto se muestra igual.
      categoria = null;
    }
  }

  return <VistaProductoDetalle producto={producto} categoria={categoria} />;
}
