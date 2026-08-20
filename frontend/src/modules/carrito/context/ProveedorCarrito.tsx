"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import { aNumero, calcularTotales } from "@/shared/lib/dinero";
import { useHidratado } from "@/shared/hooks/useHidratado";
import * as almacen from "../carritoStore";
import type { LineaCarrito } from "../types/carrito.types";

interface ValorCarrito {
  lineas: LineaCarrito[];
  /** true hasta que se lee localStorage (evita desajuste de hidratación). */
  cargando: boolean;
  unidades: number;
  subtotal: number;
  iva: number;
  total: number;
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad?: number) => void;
  cambiarCantidad: (idProducto: number, cantidad: number) => void;
  quitar: (idProducto: number) => void;
  vaciar: () => void;
}

const ContextoCarrito = createContext<ValorCarrito | null>(null);

export function ProveedorCarrito({ children }: { children: React.ReactNode }) {
  // El carrito vive en localStorage, un almacén ajeno a React: se lee, no se
  // copia a estado.
  const lineas = useSyncExternalStore(
    almacen.suscribir,
    almacen.obtenerSnapshot,
    almacen.obtenerSnapshotServidor
  );

  const hidratado = useHidratado();

  const valor = useMemo<ValorCarrito>(() => {
    const totales = calcularTotales(
      lineas.map((linea) => ({
        cantidad: linea.cantidad,
        // El precio llega como Decimal string: sin aNumero() esto concatenaría.
        precioUnitario: aNumero(linea.precio),
      }))
    );

    return {
      lineas,
      cargando: !hidratado,
      unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
      ...totales,
      agregar: almacen.agregar,
      cambiarCantidad: almacen.cambiarCantidad,
      quitar: almacen.quitar,
      vaciar: almacen.vaciar,
    };
  }, [lineas, hidratado]);

  return <ContextoCarrito.Provider value={valor}>{children}</ContextoCarrito.Provider>;
}

export function useCarrito(): ValorCarrito {
  const contexto = useContext(ContextoCarrito);
  if (!contexto) {
    throw new Error("useCarrito debe usarse dentro de <ProveedorCarrito>");
  }
  return contexto;
}
