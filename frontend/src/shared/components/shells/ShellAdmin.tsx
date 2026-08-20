"use client";

import { useEffect, useState } from "react";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { SidebarAdmin } from "./SidebarAdmin";

/**
 * Shell del panel: gris plano y sin ninguna sombra. La profundidad sale de las
 * capas #111 / #1a1a1a / #222 / #333 más bordes de 1px, igual que el guía.
 */
export function ShellAdmin({ children }: { children: React.ReactNode }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Escape cierra. Cualquier cosa superpuesta debe poder cerrarse con teclado.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setSidebarAbierto(false);
    }
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  return (
    <div className="flex min-h-dvh bg-fondo-app">
      <SidebarAdmin abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      {/* min-w-0 es imprescindible: sin él, una tabla ancha revienta el flex y
          desborda la página entera. El guía lo tapaba con overflow:hidden. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <EncabezadoAdmin onAlternarSidebar={() => setSidebarAbierto((abierto) => !abierto)} />
        <main className="flex-1 overflow-y-auto bg-fondo-app p-6 movil:p-4">{children}</main>
      </div>
    </div>
  );
}

function EncabezadoAdmin({ onAlternarSidebar }: { onAlternarSidebar: () => void }) {
  const { usuario } = useSesion();
  const inicial = usuario?.nombre?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <header className="flex items-center justify-between border-b border-borde-suave bg-superficie px-6 py-3.5">
      <button
        type="button"
        onClick={onAlternarSidebar}
        className="cursor-pointer rounded px-2 py-1 text-[1.5rem] text-texto transition-colors hover:bg-superficie-alta panel:hidden"
        aria-label="Alternar menú lateral"
      >
        ☰
      </button>

      {/* Ocupa el hueco de la hamburguesa en escritorio para que el bloque de
          usuario quede alineado a la derecha. */}
      <span className="hidden panel:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[0.95rem] font-semibold text-texto">
            {usuario?.nombre ?? "—"}
          </div>
          <div className="text-[0.8rem] text-texto-tenue">{usuario?.rol ?? ""}</div>
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-full bg-acento text-[1.1rem] font-bold text-sobre-acento"
          aria-hidden="true"
        >
          {inicial}
        </div>
      </div>
    </header>
  );
}
