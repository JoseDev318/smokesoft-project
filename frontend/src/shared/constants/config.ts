/**
 * Configuración de la aplicación. Todo llega por variables NEXT_PUBLIC_ porque
 * el mismo código corre en el navegador y en el servidor, y nada de esto es
 * secreto.
 *
 * JWT_SECRET NO va aquí ni en ningún archivo del frontend: Next nunca verifica
 * tokens (ver shared/lib/jwt.ts).
 */

function numeroDeEntorno(valor: string | undefined, porDefecto: number): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : porDefecto;
}

export const CONFIG = {
  urlApi: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  nombreApp: process.env.NEXT_PUBLIC_NOMBRE_APP ?? "SmokeSoft",
  locale: process.env.NEXT_PUBLIC_LOCALE ?? "es-CO",
  moneda: process.env.NEXT_PUBLIC_MONEDA ?? "COP",
  iva: numeroDeEntorno(process.env.NEXT_PUBLIC_IVA, 0.19),
  porPagina: numeroDeEntorno(process.env.NEXT_PUBLIC_PRODUCTOS_POR_PAGINA, 20),
} as const;

/** Claves de almacenamiento. Mismo prefijo que usaba el proyecto guía. */
export const CLAVES = {
  token: "ss_sesion",
  usuario: "ss_usuario",
  carrito: "smokesoft_carrito",
} as const;

/** Datos de contacto de la tienda (los del guía). */
export const CONTACTO = {
  telefono: "+57 310 302 4567",
  correo: "info@smokesoft.com",
  horario: ["Lunes a Viernes", "9:00 AM - 6:00 PM"],
  ubicacion: "Bogotá, Colombia",
} as const;
