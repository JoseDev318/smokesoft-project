"use client";

import { useSyncExternalStore } from "react";

// Sin suscripción: el valor nunca cambia después de hidratar.
const sinCambios = () => () => {};
const enCliente = () => true;
const enServidor = () => false;

/**
 * false durante el render del servidor y la hidratación; true después.
 *
 * Sirve para saber si ya se puede confiar en lo que hay en cookies o
 * localStorage. Se implementa con useSyncExternalStore en lugar de un
 * `useState` + `useEffect` porque llamar a setState dentro de un efecto provoca
 * renders en cascada (y el linter de React lo marca como error).
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(sinCambios, enCliente, enServidor);
}
