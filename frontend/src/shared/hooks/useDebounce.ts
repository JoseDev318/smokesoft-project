"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa un valor. Se usa en las búsquedas para no recalcular el filtrado en
 * cada tecla.
 */
export function useDebounce<T>(valor: T, milisegundos = 300): T {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setRetrasado(valor), milisegundos);
    return () => window.clearTimeout(temporizador);
  }, [valor, milisegundos]);

  return retrasado;
}
