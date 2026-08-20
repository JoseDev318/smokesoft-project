import { Insignia } from "@/shared/components/ui/estados";
import { formatearMoneda, formatearNumero } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";
import type { ColumnaCrud } from "./crud.types";

/** Pinta una celda según el formato declarado en la columna. */
export function formatearCelda<TRow>(columna: ColumnaCrud<TRow>, fila: TRow): React.ReactNode {
  // La escotilla `render` manda sobre cualquier formato.
  if (columna.render) return columna.render(fila);

  const valor = (fila as Record<string, unknown>)[columna.key];

  switch (columna.formato) {
    case "moneda":
      // El valor llega como Decimal string; formatearMoneda lo convierte.
      return formatearMoneda(valor as string);

    case "entero":
      return formatearNumero(Number(valor));

    case "fecha":
      return formatearFecha(valor as string);

    case "booleano": {
      const [siVerdadero, siFalso] = columna.etiquetasBooleano ?? ["Activo", "Inactivo"];
      return valor ? (
        <Insignia tono="exito">{siVerdadero}</Insignia>
      ) : (
        <Insignia tono="neutro">{siFalso}</Insignia>
      );
    }

    default:
      return valor === null || valor === undefined || valor === "" ? "—" : String(valor);
  }
}

/** Texto plano de una celda, para la búsqueda local. */
export function textoDeCampo(fila: unknown, campo: string): string {
  const valor = (fila as Record<string, unknown>)[campo];
  return valor === null || valor === undefined ? "" : String(valor).toLowerCase();
}
