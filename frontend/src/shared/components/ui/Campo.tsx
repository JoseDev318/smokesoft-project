import { cn } from "@/shared/lib/cn";

interface PropsBase {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  /** Variante del shell público: etiquetas blancas y controles más altos. */
  publico?: boolean;
  className?: string;
}

/** Envoltura etiqueta + control + error, con el cableado de accesibilidad. */
export function GrupoCampo({
  id, etiqueta, error, ayuda, publico, className, children,
}: PropsBase & { children: React.ReactNode }) {
  return (
    <div className={cn("grupo-campo", publico && "grupo-campo--publico", className)}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && (
        <span className="mt-1 block text-xs text-texto-tenue">{ayuda}</span>
      )}
      {/* role="alert" para que el lector de pantalla anuncie el error al aparecer */}
      {error && (
        <span id={`${id}-error`} className="error-campo" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

type PropsTexto = PropsBase &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function CampoTexto({
  id, etiqueta, error, ayuda, publico, className, ...resto
}: PropsTexto) {
  return (
    <GrupoCampo
      id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}
      publico={publico} className={className}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...resto}
      />
    </GrupoCampo>
  );
}

type PropsSelector = PropsBase &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
    opciones: { valor: string | number; etiqueta: string }[];
    placeholder?: string;
  };

export function Selector({
  id, etiqueta, error, ayuda, publico, className, opciones, placeholder, ...resto
}: PropsSelector) {
  return (
    <GrupoCampo
      id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}
      publico={publico} className={className}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...resto}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </GrupoCampo>
  );
}

type PropsAreaTexto = PropsBase &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">;

export function AreaTexto({
  id, etiqueta, error, ayuda, publico, className, ...resto
}: PropsAreaTexto) {
  return (
    <GrupoCampo
      id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}
      publico={publico} className={className}
    >
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...resto}
      />
    </GrupoCampo>
  );
}

/** Casilla de verificación: etiqueta al lado, no encima. */
export function Casilla({
  id, etiqueta, error, ...resto
}: PropsBase & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">) {
  return (
    <div className="grupo-campo">
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5">
        <input id={id} type="checkbox" className="size-4 accent-acento" {...resto} />
        <span>{etiqueta}</span>
      </label>
      {error && (
        <span className="error-campo" role="alert">{error}</span>
      )}
    </div>
  );
}
