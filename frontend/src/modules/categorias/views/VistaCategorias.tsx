"use client";

import { ModuloCrud } from "@/shared/components/crud/ModuloCrud";
import { useConfigCategorias } from "../config/categorias.crud";

export function VistaCategorias() {
  // Toda la pantalla sale de un objeto de configuración: el mismo ModuloCrud
  // atiende las cinco entidades del panel.
  const config = useConfigCategorias();
  return <ModuloCrud config={config} />;
}
