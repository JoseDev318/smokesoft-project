import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export type VarianteBoton = "acento" | "neutro" | "peligro" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  /** Estilo público: ancho completo y radio de 5px. */
  publico?: boolean;
  cargando?: boolean;
}

const CLASES: Record<VarianteBoton, string> = {
  acento: "btn-acento",
  neutro: "btn-neutro",
  peligro: "btn-peligro",
  fantasma: "btn-fantasma",
};

export function Boton({
  variante = "acento",
  publico = false,
  cargando = false,
  className,
  disabled,
  children,
  ...resto
}: Props) {
  return (
    <button
      className={cn("btn", CLASES[variante], publico && "btn-publico", className)}
      disabled={disabled || cargando}
      // aria-busy para que un lector de pantalla sepa que la acción está en curso
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? "Guardando…" : children}
    </button>
  );
}
