/**
 * Carrito persistido en localStorage, expuesto como almacén externo para React.
 *
 * No hay endpoint de carrito en el backend y no hace falta: el carrito solo
 * existe hasta el checkout, que es cuando se convierte en una venta real.
 * localStorage tiene además la ventaja de que SOBREVIVE al desvío a la pantalla
 * de ingreso cuando un visitante anónimo intenta pagar.
 *
 * Se lee con useSyncExternalStore y no copiándolo a estado dentro de un efecto,
 * porque eso último provoca renders en cascada.
 */

import { CLAVES } from "@/shared/constants/config";
import type { LineaCarrito } from "./types/carrito.types";

const EVENTO_CAMBIO = "carrito:cambio";

const VACIO: LineaCarrito[] = [];

// useSyncExternalStore exige que el snapshot sea REFERENCIALMENTE ESTABLE entre
// llamadas o entra en bucle infinito. Se memoriza el array y solo se reconstruye
// cuando el texto guardado cambia de verdad.
let cacheCrudo: string | null = null;
let cacheLineas: LineaCarrito[] = VACIO;
let cacheInicializada = false;

function leerCrudo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CLAVES.carrito);
  } catch {
    return null;
  }
}

export function obtenerSnapshot(): LineaCarrito[] {
  const crudo = leerCrudo();

  if (cacheInicializada && crudo === cacheCrudo) return cacheLineas;

  cacheCrudo = crudo;
  cacheInicializada = true;

  if (!crudo) {
    cacheLineas = VACIO;
    return VACIO;
  }

  try {
    const datos = JSON.parse(crudo);
    cacheLineas = Array.isArray(datos) ? (datos as LineaCarrito[]) : VACIO;
  } catch {
    // Dato corrupto: se descarta en lugar de dejar el carrito inservible.
    try { localStorage.removeItem(CLAVES.carrito); } catch { /* sin permisos */ }
    cacheLineas = VACIO;
  }

  return cacheLineas;
}

/** En el servidor no hay localStorage: el carrito arranca vacío. */
export function obtenerSnapshotServidor(): LineaCarrito[] {
  return VACIO;
}

export function suscribir(alCambiar: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const manejar = () => {
    cacheInicializada = false;
    alCambiar();
  };

  window.addEventListener(EVENTO_CAMBIO, manejar);
  // Cambios hechos en otra pestaña.
  window.addEventListener("storage", manejar);

  return () => {
    window.removeEventListener(EVENTO_CAMBIO, manejar);
    window.removeEventListener("storage", manejar);
  };
}

function escribir(lineas: LineaCarrito[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVES.carrito, JSON.stringify(lineas));
  } catch {
    // Cuota llena o modo privado: el carrito seguirá funcionando en memoria
    // hasta recargar, que es mejor que romper la compra.
  }
  cacheInicializada = false;
  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO));
}

/* ---------- Operaciones ---------- */

export function agregar(nueva: Omit<LineaCarrito, "cantidad">, cantidad = 1): void {
  const actuales = obtenerSnapshot();
  const existente = actuales.find((linea) => linea.id_producto === nueva.id_producto);

  if (!existente) {
    escribir([
      ...actuales,
      { ...nueva, cantidad: Math.min(Math.max(1, cantidad), nueva.stockConocido) },
    ]);
    return;
  }

  // Nunca por encima del stock conocido: el backend rechazaría la venta con un
  // 409 y es mejor no dejar llegar ahí.
  const total = Math.min(existente.cantidad + cantidad, nueva.stockConocido);

  escribir(
    actuales.map((linea) =>
      linea.id_producto === nueva.id_producto
        // Se refrescan precio y stock con el dato más reciente del catálogo.
        ? { ...linea, ...nueva, cantidad: total }
        : linea
    )
  );
}

export function cambiarCantidad(idProducto: number, cantidad: number): void {
  const actuales = obtenerSnapshot();

  if (cantidad <= 0) {
    escribir(actuales.filter((linea) => linea.id_producto !== idProducto));
    return;
  }

  escribir(
    actuales.map((linea) =>
      linea.id_producto === idProducto
        ? { ...linea, cantidad: Math.min(cantidad, linea.stockConocido) }
        : linea
    )
  );
}

export function quitar(idProducto: number): void {
  escribir(obtenerSnapshot().filter((linea) => linea.id_producto !== idProducto));
}

export function vaciar(): void {
  escribir([]);
}
