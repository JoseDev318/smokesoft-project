/**
 * Decodifica el payload de un JWT. NO verifica la firma.
 *
 * No puede: la firma es HS256 con `JWT_SECRET`, que vive solo en el backend.
 * Mandar ese secreto al navegador para poder validar aquí sería estrictamente
 * peor que no validar.
 *
 * Sirve para una sola cosa: saber si el token YA EXPIRÓ y evitar una petición
 * condenada al 403. La autoridad sobre si una sesión vale sigue siendo el
 * backend.
 */

export interface PayloadToken {
  id: number;
  nombre: string;
  rol: string;
  id_cliente: number | null;
  iat?: number;
  exp?: number;
}

export function decodificarToken(token: string): PayloadToken | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url -> base64, y se restaura el relleno que el estándar omite.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    const json = atob(relleno);
    // El payload puede traer caracteres no ASCII (un nombre con tilde), y atob
    // devuelve bytes: sin este paso "José" llegaría como "JosÃ©".
    const texto = decodeURIComponent(
      json
        .split("")
        .map((caracter) => `%${caracter.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );

    return JSON.parse(texto) as PayloadToken;
  } catch {
    return null;
  }
}

/** true si el token está vencido o no se puede leer. */
export function tokenExpirado(token: string): boolean {
  const payload = decodificarToken(token);
  if (!payload?.exp) return true;
  // `exp` va en segundos; Date.now() en milisegundos.
  return payload.exp * 1000 <= Date.now();
}
