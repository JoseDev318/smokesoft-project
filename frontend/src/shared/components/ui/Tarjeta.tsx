import { cn } from "@/shared/lib/cn";

/**
 * Tarjeta del panel: superficie #222 con borde de 1px y radio de 10px.
 * Sin sombra a propósito — el panel admin del guía no usa ninguna, la
 * profundidad sale de las capas de gris.
 */
export function Tarjeta({
  className,
  children,
  ...resto
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-tarjeta border border-borde-suave bg-superficie p-5",
        className
      )}
      {...resto}
    >
      {children}
    </div>
  );
}

/** Encabezado de tarjeta: título a la izquierda, acciones a la derecha. */
export function CabeceraTarjeta({
  titulo,
  children,
}: {
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
      <h3 className="text-[1.1rem] font-semibold text-texto">{titulo}</h3>
      {children}
    </div>
  );
}
