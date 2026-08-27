import { fetchBackend } from "@/lib/backend";
import CategoriasClient from "./CategoriasClient";
import type { Categoria } from "@/types/categoria";

export default async function CategoriasPage() {
  const categorias: Categoria[] = await fetchBackend("/categorias");

  return <CategoriasClient categorias={categorias} />;
}