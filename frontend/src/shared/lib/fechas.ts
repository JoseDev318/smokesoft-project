import { CONFIG } from "@/shared/constants/config";
import type { FechaISO } from "@/shared/types/bd.types";

/**
 * Formatea una fecha del backend SIN corrimiento de zona horaria.
 *
 * El problema: `venta.fecha` es un DATE de Postgres. Los endpoints nuevos la
 * devuelven ya como texto ("2026-08-20") con `fecha::text`, pero cualquier
 * consulta que se añada sin ese cast entrega un Date que JSON serializa como
 * "2026-08-20T00:00:00.000Z". En Bogotá (UTC-5) un `toLocaleDateString()` sobre
 * esa medianoche UTC muestra el 19, es decir el DÍA ANTERIOR.
 *
 * La solución es leer las partes de la fecha, no interpretarlas como instante.
 */
export function formatearFecha(valor: FechaISO | null | undefined): string {
  const partes = extraerPartes(valor);
  if (!partes) return "—";

  const [anio, mes, dia] = partes;
  // Se construye en hora local a mediodía: así ningún ajuste de zona horaria
  // puede empujar la fecha al día vecino.
  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0);

  return fecha.toLocaleDateString(CONFIG.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Variante con el mes escrito, para detalles de pedido. */
export function formatearFechaLarga(valor: FechaISO | null | undefined): string {
  const partes = extraerPartes(valor);
  if (!partes) return "—";

  const [anio, mes, dia] = partes;
  return new Date(anio, mes - 1, dia, 12, 0, 0).toLocaleDateString(CONFIG.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Fecha de hoy en formato YYYY-MM-DD, para inputs `type="date"`. */
export function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Saca [año, mes, día] de "2026-08-20" o de "2026-08-20T00:00:00.000Z".
 * En el segundo caso se toman las partes UTC a propósito: la medianoche UTC
 * pertenece al día que Postgres guardó.
 */
function extraerPartes(valor: FechaISO | null | undefined): [number, number, number] | null {
  if (!valor) return null;

  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (soloFecha) {
    return [Number(soloFecha[1]), Number(soloFecha[2]), Number(soloFecha[3])];
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return [fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate()];
}
