import type { ReactNode } from "react";
import type { ZodType } from "zod";

/**
 * Configuración del módulo CRUD genérico.
 *
 * Es `crudFactory.js` del proyecto guía reencarnado: misma filosofía de objeto
 * de configuración, mismo layout de dos tarjetas, mismas acciones emoji — pero
 * genérico, tipado, validado, y sin el bug del `editingId` en scope de módulo
 * que compartían sus cuatro instancias.
 */

export type TipoCampo =
  | "texto" | "correo" | "tel" | "numero" | "clave"
  | "select" | "casilla" | "areatexto";

export interface OpcionCampo {
  valor: string | number;
  etiqueta: string;
}

export interface CampoCrud<TForm> {
  /** Tipado contra el formulario: un typo aquí no compila. */
  name: Extract<keyof TForm, string>;
  label: string;
  tipo: TipoCampo;
  placeholder?: string;
  opciones?: OpcionCampo[];
  /** Placeholder de un select ("Seleccionar…"). */
  vacio?: string;
  /** Solo aparece al crear. Ej: `clave` en usuarios, `stock` en productos. */
  soloEnCrear?: boolean;
  /** "mitad" agrupa el campo en una fila de dos columnas. */
  ancho?: "completo" | "mitad";
  ayuda?: string;
  min?: number;
  max?: number;
  paso?: number;
}

export type FormatoColumna = "texto" | "moneda" | "booleano" | "fecha" | "entero";

export interface ColumnaCrud<TRow> {
  key: string;
  label: string;
  formato?: FormatoColumna;
  /** Escotilla para joins, insignias o cualquier celda a medida. */
  render?: (fila: TRow) => ReactNode;
  alinear?: "izq" | "der";
  /** Etiquetas para el formato booleano. Por defecto Activo/Inactivo. */
  etiquetasBooleano?: [string, string];
}

export interface AccionExtra<TRow> {
  icono: string;
  titulo: string;
  variante: "editar" | "eliminar" | "ver";
  onClick: (fila: TRow) => void | Promise<void>;
  visible?: (fila: TRow) => boolean;
  /** Si devuelve texto, se pide confirmación con ese mensaje. */
  confirmar?: (fila: TRow) => string;
}

export interface ServicioCrud<TRow> {
  listar: () => Promise<TRow[]>;
  crear: (dto: never) => Promise<TRow>;
  actualizar: (id: number, dto: never) => Promise<TRow>;
  eliminar: (id: number) => Promise<void>;
}

export interface ConfigCrud<TRow, TForm extends Record<string, unknown>> {
  /** Clave de react-query y de la caché compartida. */
  clave: string;
  entidad: string;         // "Producto"  → "Registrar Producto"
  entidadPlural: string;   // "Productos" → "Gestión de Productos"
  /** Para los mensajes: "el Producto" vs "la Categoría". */
  genero?: "m" | "f";

  /** id_producto vs id_usuario vs id_categoria: explícito, sin adivinar. */
  obtenerId: (fila: TRow) => number;
  /** Texto que identifica la fila en el diálogo de borrado. */
  etiquetaFila?: (fila: TRow) => string;

  campos: CampoCrud<TForm>[];
  columnas: ColumnaCrud<TRow>[];
  camposBusqueda: (keyof TRow & string)[];

  /** OBLIGATORIO: el backend no valida nada. */
  esquema: ZodType<TForm>;
  valoresIniciales: TForm;
  aFormulario: (fila: TRow) => TForm;
  aDtoCrear: (form: TForm) => unknown;
  /** Separado del de crear: el PUT omite campos como `clave` o `stock`. */
  aDtoActualizar: (form: TForm) => unknown;

  servicio: ServicioCrud<TRow>;

  puedeCrear?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;

  accionesExtra?: AccionExtra<TRow>[];
  /** La API no pagina: se hace en cliente. */
  porPagina?: number;
  /** Invalidaciones adicionales tras guardar (el `onChange` del guía). */
  clavesAInvalidar?: string[][];
  vacio?: { titulo: string; mensaje?: string };
}
