import { cn } from "@/shared/lib/cn";

/**
 * Teja de estadística del dashboard.
 *
 * El borde izquierdo cian de 4px es uno de los dos motivos de identidad visual
 * más fuertes del guía (el otro es el borde de 2px en las cajas de auth).
 */
export function TejaDato({
  etiqueta,
  valor,
  esMoneda = false,
  className,
}: {
  etiqueta: string;
  valor: string | number;
  /** Los importes usan un tamaño menor: son cadenas mucho más largas. */
  esMoneda?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[140px] flex-1 rounded-tarjeta border-l-4 border-l-acento bg-superficie px-6 py-[18px] text-center",
        className
      )}
    >
      <h3 className="mb-2 text-[0.85rem] font-medium text-texto-apagado">{etiqueta}</h3>
      <p
        className={cn(
          "font-bold text-acento",
          esMoneda ? "text-teja-moneda" : "text-teja"
        )}
      >
        {valor}
      </p>
    </div>
  );
}
