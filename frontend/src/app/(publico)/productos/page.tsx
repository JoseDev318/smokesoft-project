import { catalogoService } from "@/modules/catalogo/services/catalogo.service";
import { VistaCatalogo } from "@/modules/catalogo/views/VistaCatalogo";
import type { CategoriaFila, ProductoFila } from "@/shared/types/bd.types";

export const metadata = { title: "Productos" };

// Los GET del catálogo son públicos, así que se pueden pedir en el servidor y
// cachear. La vista recibe el resultado como datos iniciales y sigue
// refrescándose en cliente al filtrar.
export const revalidate = 60;

export default async function Pagina() {
  // Si la API no responde (backend apagado, que es el caso habitual en
  // desarrollo, o un despliegue estático anterior al arranque del servidor), la
  // tienda no debe caerse: se renderiza sin datos iniciales y el cliente
  // reintenta y muestra el error recuperable de la vista.
  let productos: ProductoFila[] | undefined;
  let categorias: CategoriaFila[] | undefined;

  try {
    [productos, categorias] = await Promise.all([
      catalogoService.listarProductos(),
      catalogoService.listarCategorias(),
    ]);
  } catch {
    productos = undefined;
    categorias = undefined;
  }

  return <VistaCatalogo productosIniciales={productos} categoriasIniciales={categorias} />;
}
