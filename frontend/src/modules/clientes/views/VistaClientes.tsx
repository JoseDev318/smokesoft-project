"use client";

import { ModuloCrud } from "@/shared/components/crud/ModuloCrud";
import { useConfigClientes } from "../config/clientes.crud";

export function VistaClientes() {
  // Toda la pantalla sale de un objeto de configuración: el mismo ModuloCrud
  // atiende las cinco entidades del panel.
  const config = useConfigClientes();
  return <ModuloCrud config={config} />;
}
