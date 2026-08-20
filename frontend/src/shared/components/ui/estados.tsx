import { cn } from "@/shared/lib/cn";

/** Indicador de carga. `pantallaCompleta` para las guardias de layout. */
export function Cargando({
  texto = "Cargando…",
  pantallaCompleta = false,
}: {
  texto?: string;
  pantallaCompleta?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 text-texto-apagado",
        pantallaCompleta ? "min-h-dvh" : "py-10"
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className="size-5 animate-spin rounded-full border-2 border-borde border-t-acento"
        aria-hidden="true"
      />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

/** Mensaje de error con opción de reintentar. */
export function MensajeError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <div
      className="rounded-admin border border-peligro/40 bg-peligro-tinte px-4 py-3 text-sm text-texto"
      role="alert"
    >
      <p>{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-2 cursor-pointer font-semibold text-acento underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Estado vacío para listados y tablas. */
export function EstadoVacio({
  titulo,
  mensaje,
  children,
}: {
  titulo: string;
  mensaje?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-12 text-center">
      <p className="text-base font-semibold text-texto-secundario">{titulo}</p>
      {mensaje && <p className="mt-1.5 text-sm text-texto-tenue">{mensaje}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  );
}

/** Insignia de estado (Activo/Inactivo, estados de pedido, stock bajo). */
export type TonoInsignia = "exito" | "peligro" | "alerta" | "neutro" | "info";

const TONOS: Record<TonoInsignia, string> = {
  exito: "bg-exito/20 text-exito",
  peligro: "bg-peligro-tinte text-peligro",
  alerta: "bg-alerta/20 text-alerta",
  info: "bg-info-tinte text-info",
  neutro: "bg-superficie-alta text-texto-apagado",
};

export function Insignia({
  children,
  tono = "neutro",
}: {
  children: React.ReactNode;
  tono?: TonoInsignia;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-etiqueta px-2 py-0.5 text-xs font-semibold",
        TONOS[tono]
      )}
    >
      {children}
    </span>
  );
}
