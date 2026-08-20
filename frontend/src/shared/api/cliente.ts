/**
 * Wrapper de fetch. Concentra todas las rarezas del backend en un solo sitio.
 *
 * Cada rama de este archivo existe por un comportamiento concreto y verificado
 * de la API; están comentadas una por una.
 */

import { CONFIG } from "@/shared/constants/config";
import {
  ErrorApi, ErrorNoEncontrado, ErrorPermisos, ErrorRed, ErrorSesion,
} from "./errores";
import { traducirError } from "./traducirError";
import { avisarSesionExpirada, leerToken, limpiar } from "./sesionStore";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OpcionesPeticion {
  metodo?: Metodo;
  cuerpo?: unknown;
  /** No adjuntar el token (catálogo público, login, registro). */
  publico?: boolean;
  /** false para DELETE: responde 204 sin cuerpo. */
  esperaCuerpo?: boolean;
  /** true para PUT/PATCH: un cuerpo vacío significa "no existe" (ver abajo). */
  exigeCuerpo?: boolean;
  /** Revalidación de Next, solo aplica en peticiones desde el servidor. */
  revalidate?: number;
  senal?: AbortSignal;
}

function enServidor(): boolean {
  return typeof window === "undefined";
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const {
    metodo = "GET",
    cuerpo,
    publico = false,
    esperaCuerpo = true,
    exigeCuerpo = false,
    revalidate,
    senal,
  } = opciones;

  const cabeceras: Record<string, string> = {};
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";

  if (!publico) {
    // En el servidor no hay cookies del navegador accesibles desde aquí, así
    // que una petición autenticada nunca funcionaría. Es un error de
    // programación, no del usuario: se avisa fuerte en desarrollo.
    if (enServidor()) {
      throw new Error(
        `peticion(): "${ruta}" requiere token pero se llamó desde el servidor. ` +
        `Las peticiones autenticadas van en componentes de cliente; las de RSC deben usar { publico: true }.`
      );
    }

    const token = leerToken();
    if (token) cabeceras.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit & { next?: { revalidate: number } } = {
    method: metodo,
    headers: cabeceras,
    signal: senal,
  };

  if (cuerpo !== undefined) init.body = JSON.stringify(cuerpo);
  if (revalidate !== undefined && enServidor()) init.next = { revalidate };

  let respuesta: Response;
  try {
    respuesta = await fetch(`${CONFIG.urlApi}${ruta}`, init);
  } catch (error) {
    // fetch solo rechaza por fallo de red. El backend apagado es el caso más
    // habitual en desarrollo local, y merece un mensaje accionable.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ErrorRed();
  }

  // Se lee el cuerpo como TEXTO una sola vez. Nunca `.json()` a ciegas: un 204
  // de DELETE no tiene cuerpo y `.json()` lanzaría un error de parseo que
  // taparía una operación en realidad exitosa.
  const texto = await respuesta.text();

  if (!respuesta.ok) {
    throw construirError(respuesta.status, texto);
  }

  const vacio = texto.length === 0;

  if (vacio) {
    // Un PUT/PATCH que responde 200 SIN cuerpo significa que el id no existía:
    // los servicios del backend devuelven `result.rows[0]`, que es `undefined`
    // cuando no hubo coincidencias, y `res.json(undefined)` manda un 200 vacío.
    // Sin esta rama, la interfaz mostraría "guardado" para una escritura que no
    // tocó ninguna fila.
    if (exigeCuerpo) throw new ErrorNoEncontrado();
    return undefined as T;
  }

  if (!esperaCuerpo) return undefined as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ErrorApi("La respuesta del servidor no es válida.", respuesta.status, texto);
  }
}

function construirError(estado: number, texto: string): Error {
  const crudo = extraerMensaje(texto);

  if (estado === 401) {
    cerrarSesionLocal();
    return new ErrorSesion(crudo || undefined, 401, crudo);
  }

  if (estado === 403) {
    // El 403 está SOBRECARGADO en este backend:
    //   auth.middleware.js -> "Token inválido o expirado."     => reloguear
    //   role.middleware.js -> "No tienes permisos para..."      => la sesión vale
    // Confundirlos expulsaría a un usuario 'Inventario' que pulse un botón
    // reservado al Administrador.
    if (/token/i.test(crudo)) {
      cerrarSesionLocal();
      return new ErrorSesion(undefined, 403, crudo);
    }
    return new ErrorPermisos(crudo || undefined, crudo);
  }

  if (estado === 404) {
    return new ErrorNoEncontrado(crudo || undefined, crudo);
  }

  return new ErrorApi(traducirError(crudo, estado), estado, crudo);
}

function cerrarSesionLocal(): void {
  if (enServidor()) return;
  limpiar();
  // El wrapper no puede usar hooks: avisa por evento y el proveedor de sesión
  // reacciona limpiando el estado y redirigiendo.
  avisarSesionExpirada();
}

/** El backend responde los errores como { error: "mensaje" }. */
function extraerMensaje(texto: string): string {
  if (!texto) return "";
  try {
    const datos = JSON.parse(texto) as { error?: string; message?: string };
    return datos.error ?? datos.message ?? "";
  } catch {
    return texto;
  }
}

/* ---------- Azúcar sintáctica ----------
   Los valores por defecto codifican las convenciones del backend: DELETE no
   devuelve cuerpo, y PUT/PATCH sí lo exigen. */

export const api = {
  get: <T>(ruta: string, opciones: Omit<OpcionesPeticion, "metodo" | "cuerpo"> = {}) =>
    peticion<T>(ruta, { ...opciones, metodo: "GET" }),

  post: <T>(ruta: string, cuerpo?: unknown, opciones: OpcionesPeticion = {}) =>
    peticion<T>(ruta, { ...opciones, metodo: "POST", cuerpo }),

  put: <T>(ruta: string, cuerpo: unknown, opciones: OpcionesPeticion = {}) =>
    peticion<T>(ruta, { ...opciones, metodo: "PUT", cuerpo, exigeCuerpo: true }),

  patch: <T>(ruta: string, cuerpo: unknown, opciones: OpcionesPeticion = {}) =>
    peticion<T>(ruta, { ...opciones, metodo: "PATCH", cuerpo, exigeCuerpo: true }),

  del: (ruta: string, opciones: OpcionesPeticion = {}) =>
    peticion<void>(ruta, { ...opciones, metodo: "DELETE", esperaCuerpo: false }),
};
