"use client";

import { ModuloCrud } from "@/shared/components/crud/ModuloCrud";
import { useConfigProductos } from "../config/productos.crud";

export function VistaProductos() {
  // Toda la pantalla sale de un objeto de configuración: el mismo ModuloCrud
  // atiende las cinco entidades del panel.
  const config = useConfigProductos();
  return <ModuloCrud config={config} />;
}
