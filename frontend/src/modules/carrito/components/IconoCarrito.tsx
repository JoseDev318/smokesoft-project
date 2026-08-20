"use client";

import Link from "next/link";

import { useCarrito } from "../context/ProveedorCarrito";
import { RUTAS } from "@/shared/constants/rutas";

/** Acceso al carrito con contador de unidades. */
export function IconoCarrito() {
  const { unidades, cargando } = useCarrito();

  return (
    <Link
      href={RUTAS.carrito}
      className="relative inline-flex items-center rounded p-1 text-xl transition-transform hover:scale-110"
      aria-label={unidades > 0 ? `Carrito con ${unidades} artículos` : "Carrito vacío"}
    >
      <span aria-hidden="true">🛒</span>
      {/* Mientras `cargando` no se pinta el contador: el servidor no puede leer
          localStorage y renderizar un 0 provocaría un salto visible. */}
      {!cargando && unidades > 0 && (
        <span className="absolute -right-1.5 -top-1 flex size-[18px] items-center justify-center rounded-full bg-acento text-[0.7rem] font-bold text-sobre-acento">
          {unidades > 99 ? "99+" : unidades}
        </span>
      )}
    </Link>
  );
}
