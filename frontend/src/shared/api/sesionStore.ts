/**
 * Lectura y escritura de la sesión. Deliberadamente SIN React.
 *
 * Por qué sin hooks: el wrapper de fetch necesita el token, y si dependiera de
 * un contexto se formaría el enredo circular "el wrapper necesita el contexto,
 * el contexto necesita el wrapper".
 *
 * Por qué COOKIE y no localStorage: `middleware.ts` corre antes de cualquier JS
 * del navegador, donde `localStorage` no existe. Con localStorage la protección
 * del panel sería solo del lado del cliente, así que /panel enviaría el shell
 * completo del administrador a un visitante deslogueado y solo DESPUÉS
 * redirigiría — parpadeo visible en cada carga.
 *
 * Sobre seguridad: la cookie NO es HttpOnly, así que un script inyectado podría
 * leerla. Eso es EXACTAMENTE igual que con localStorage: no hay regresión. La
 * alternativa realmente más segura es HttpOnly + un proxy en Next (BFF), que
 * duplica toda la superficie de API; queda como camino de mejora. Las defensas
 * que sí importan a este nivel son no usar dangerouslySetInnerHTML con datos de
 * la API y las cabeceras CSP de next.config.ts.
 */

import { CLAVES } from "@/shared/constants/config";
import { tokenExpirado } from "@/shared/lib/jwt";
import type { Rol } from "@/shared/types/bd.types";

export interface SesionUsuario {
  id: number;
  nombre: string;
  rol: Rol;
  id_cliente: number | null;
}

const OCHO_HORAS = 60 * 60 * 8; // igual que JWT_EXPIRES_IN del backend

function esNavegador(): boolean {
  return typeof document !== "undefined";
}

function leerCookie(nombre: string): string | null {
  if (!esNavegador()) return null;

  const prefijo = `${nombre}=`;
  const encontrada = document.cookie
    .split("; ")
    .find((parte) => parte.startsWith(prefijo));

  return encontrada ? decodeURIComponent(encontrada.slice(prefijo.length)) : null;
}

function escribirCookie(nombre: string, valor: string): void {
  if (!esNavegador()) return;

  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${nombre}=${encodeURIComponent(valor)}; Path=/; Max-Age=${OCHO_HORAS}; SameSite=Lax${seguro}`;
}

function borrarCookie(nombre: string): void {
  if (!esNavegador()) return;
  document.cookie = `${nombre}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function leerToken(): string | null {
  return leerCookie(CLAVES.token);
}

export function leerUsuario(): SesionUsuario | null {
  const crudo = leerCookie(CLAVES.usuario);
  if (!crudo) return null;

  try {
    return JSON.parse(crudo) as SesionUsuario;
  } catch {
    // Cookie corrupta: se limpia para no dejar la sesión en un estado ambiguo.
    limpiar();
    return null;
  }
}

export function guardar(token: string, usuario: SesionUsuario): void {
  escribirCookie(CLAVES.token, token);
  escribirCookie(CLAVES.usuario, JSON.stringify(usuario));
  notificarCambio();
}

export function limpiar(): void {
  borrarCookie(CLAVES.token);
  borrarCookie(CLAVES.usuario);
  notificarCambio();
}

/** true si no hay token o si su `exp` ya pasó. */
export function estaExpirado(): boolean {
  const token = leerToken();
  return !token || tokenExpirado(token);
}

/** Sesión utilizable: hay token, no expiró y hay datos de usuario. */
export function sesionValida(): boolean {
  return !estaExpirado() && leerUsuario() !== null;
}

/* ---------- Aviso de expiración ----------
   El wrapper de fetch no puede llamar a un hook, así que avisa por un evento de
   window y el proveedor de sesión lo escucha. Así una expiración detectada en
   medio de una mutación limpia el estado en toda la aplicación. */

export const EVENTO_SESION_EXPIRADA = "sesion:expirada";
const EVENTO_SESION_CAMBIO = "sesion:cambio";

export function avisarSesionExpirada(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA));
}

/* ---------- Almacén externo para React ----------
   Las cookies son un almacén ajeno a React, así que se leen con
   useSyncExternalStore en lugar de copiarlas a estado dentro de un efecto (lo
   segundo provoca renders en cascada y el linter lo marca como error).

   useSyncExternalStore exige que obtenerSnapshot() devuelva un valor
   REFERENCIALMENTE ESTABLE entre llamadas, o entra en bucle infinito de
   renders. Por eso se memoriza el objeto y solo se reconstruye cuando el texto
   crudo de la cookie cambia de verdad. */

let cacheCrudo: string | null = null;
let cacheUsuario: SesionUsuario | null = null;
let cacheInicializada = false;

export function obtenerSnapshotSesion(): SesionUsuario | null {
  const crudo = leerCookie(CLAVES.usuario);

  if (cacheInicializada && crudo === cacheCrudo) return cacheUsuario;

  cacheCrudo = crudo;
  cacheInicializada = true;

  if (!crudo || estaExpirado()) {
    cacheUsuario = null;
    return null;
  }

  try {
    cacheUsuario = JSON.parse(crudo) as SesionUsuario;
  } catch {
    cacheUsuario = null;
  }
  return cacheUsuario;
}

/** Snapshot del servidor: allí no hay cookies accesibles. */
export function obtenerSnapshotServidor(): SesionUsuario | null {
  return null;
}

export function suscribirSesion(alCambiar: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const manejar = () => {
    // Se invalida la caché para que el próximo snapshot vuelva a leer la cookie.
    cacheInicializada = false;
    alCambiar();
  };

  window.addEventListener(EVENTO_SESION_CAMBIO, manejar);
  window.addEventListener(EVENTO_SESION_EXPIRADA, manejar);
  // `storage` avisa de cambios hechos en OTRA pestaña: cerrar sesión en una
  // debe reflejarse en las demás.
  window.addEventListener("storage", manejar);

  return () => {
    window.removeEventListener(EVENTO_SESION_CAMBIO, manejar);
    window.removeEventListener(EVENTO_SESION_EXPIRADA, manejar);
    window.removeEventListener("storage", manejar);
  };
}

function notificarCambio(): void {
  cacheInicializada = false;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_CAMBIO));
}
