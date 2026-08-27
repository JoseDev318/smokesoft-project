import { fetchBackend } from "@/lib/backend";
import ProductosClient from "./ProductosClient";
import type { Producto, Categoria, Proveedor } from "@/types/producto";

export default async function ProductosPage() {
  const [productos, categorias, proveedores]: [Producto[], Categoria[], Proveedor[]] =
    await Promise.all([
      fetchBackend("/productos"),
      fetchBackend("/categorias"),
      fetchBackend("/proveedores"),
    ]);

  return (
    <ProductosClient
      productos={productos}
      categorias={categorias}
      proveedores={proveedores}
    />
  );
}