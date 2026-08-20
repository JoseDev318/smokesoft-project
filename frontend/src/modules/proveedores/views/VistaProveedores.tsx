"use client";

import { ModuloCrud } from "@/shared/components/crud/ModuloCrud";
import { useConfigProveedores } from "../config/proveedores.crud";

export function VistaProveedores() {
  // Toda la pantalla sale de un objeto de configuración: el mismo ModuloCrud
  // atiende las cinco entidades del panel.
  const config = useConfigProveedores();
  return <ModuloCrud config={config} />;
}
