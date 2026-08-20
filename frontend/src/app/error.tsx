"use client";

import { useEffect } from "react";

/** Frontera de error global. Debe ser componente de cliente. */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // El mensaje real queda en consola; al usuario se le muestra algo legible.
    console.error(error);
  }, [error]);

  return (
    <div className="fondo-humo flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="text-[3rem]" aria-hidden="true">💨</p>
      <h1 className="mb-2 text-xl font-semibold text-texto">Algo salió mal</h1>
      <p className="mb-6 max-w-md text-sm text-texto-secundario">
        No pudimos cargar esta sección. Si el problema continúa, verifica que el
        servidor esté encendido.
      </p>
      <button type="button" onClick={reset} className="btn btn-acento">
        Reintentar
      </button>
    </div>
  );
}
