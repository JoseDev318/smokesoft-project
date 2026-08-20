"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Avisos flotantes. Reemplazan los `alert()` del proyecto guía, que bloqueaban
 * la página y no encajaban con el diseño.
 */

export type TipoAviso = "exito" | "error" | "info";

interface Aviso {
  id: number;
  tipo: TipoAviso;
  mensaje: string;
}

interface ValorAvisos {
  avisos: Aviso[];
  mostrar: (mensaje: string, tipo?: TipoAviso) => void;
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  cerrar: (id: number) => void;
}

const ContextoAvisos = createContext<ValorAvisos | null>(null);

const DURACION = 4000;
let contador = 0;

export function ProveedorAvisos({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const cerrar = useCallback((id: number) => {
    setAvisos((previos) => previos.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrar = useCallback((mensaje: string, tipo: TipoAviso = "info") => {
    contador += 1;
    const id = contador;
    setAvisos((previos) => [...previos, { id, tipo, mensaje }]);
    window.setTimeout(() => cerrar(id), DURACION);
  }, [cerrar]);

  const valor = useMemo<ValorAvisos>(() => ({
    avisos,
    mostrar,
    exito: (mensaje: string) => mostrar(mensaje, "exito"),
    error: (mensaje: string) => mostrar(mensaje, "error"),
    cerrar,
  }), [avisos, mostrar, cerrar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <PilaDeAvisos avisos={avisos} cerrar={cerrar} />
    </ContextoAvisos.Provider>
  );
}

const ESTILO_POR_TIPO: Record<TipoAviso, string> = {
  exito: "border-l-4 border-l-exito",
  error: "border-l-4 border-l-peligro",
  info: "border-l-4 border-l-acento",
};

function PilaDeAvisos({ avisos, cerrar }: { avisos: Aviso[]; cerrar: (id: number) => void }) {
  if (!avisos.length) return null;

  return (
    // aria-live para que un lector de pantalla anuncie el aviso sin robar el foco.
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-200 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2.5"
      role="status"
      aria-live="polite"
    >
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-admin border border-borde-suave bg-superficie px-4 py-3 text-sm text-texto shadow-lg ${ESTILO_POR_TIPO[aviso.tipo]}`}
        >
          <span className="flex-1">{aviso.mensaje}</span>
          <button
            type="button"
            onClick={() => cerrar(aviso.id)}
            className="cursor-pointer text-texto-tenue transition-colors hover:text-texto"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function useAvisos(): ValorAvisos {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) {
    throw new Error("useAvisos debe usarse dentro de <ProveedorAvisos>");
  }
  return contexto;
}
