import { CONFIG } from "@/shared/constants/config";
import type { Decimal } from "@/shared/types/bd.types";

/**
 * ÚNICO lugar donde un Decimal de Postgres se convierte a número.
 *
 * `pg` no convierte DECIMAL/NUMERIC: los entrega como string ("7800.00").
 * Por eso `producto.precio + otro.precio` concatena en lugar de sumar, en
 * silencio y sin error de tipos si se escapa del tipado.
 */
export function aNumero(valor: Decimal | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/**
 * Formato de moneda colombiana, equivalente al `'$' + toLocaleString('es-CO')`
 * que usaba el proyecto guía. Sin decimales: los precios del catálogo son
 * miles de pesos redondos.
 */
export function formatearMoneda(valor: Decimal | number | null | undefined): string {
  const numero = aNumero(valor);
  return `$${numero.toLocaleString(CONFIG.locale, { maximumFractionDigits: 0 })}`;
}

/** Formato numérico simple (existencias, cantidades). */
export function formatearNumero(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString(CONFIG.locale);
}

/**
 * Cálculo de totales de una venta.
 *
 * Replica el `Math.round(subtotal * 0.19)` del guía para que lo que se muestra
 * antes de confirmar coincida con lo que el backend calcula y guarda. Aun así,
 * los totales que se MUESTRAN de una venta ya registrada son siempre los
 * almacenados, no un recálculo: la tasa puede haber cambiado desde entonces.
 */
export function calcularTotales(
  lineas: { cantidad: number; precioUnitario: number }[]
): { subtotal: number; iva: number; total: number } {
  const subtotal = lineas.reduce(
    (suma, linea) => suma + Math.round(linea.precioUnitario * linea.cantidad),
    0
  );
  const iva = Math.round(subtotal * CONFIG.iva);
  return { subtotal, iva, total: subtotal + iva };
}
