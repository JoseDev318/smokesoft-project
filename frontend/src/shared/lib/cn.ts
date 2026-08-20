import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind (la última
 * gana). Sin esto, `cn("p-4", esCompacto && "p-2")` dejaría las dos y el
 * resultado dependería del orden en la hoja generada.
 */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}
