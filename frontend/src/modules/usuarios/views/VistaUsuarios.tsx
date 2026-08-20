"use client";

import { ModuloCrud } from "@/shared/components/crud/ModuloCrud";
import { useConfigUsuarios } from "../config/usuarios.crud";

export function VistaUsuarios() {
  // Toda la pantalla sale de un objeto de configuración: el mismo ModuloCrud
  // atiende las cinco entidades del panel.
  const config = useConfigUsuarios();
  return <ModuloCrud config={config} />;
}
