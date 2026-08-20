/**
 * Tipos de error de la capa de API.
 *
 * Se distinguen por clase y no por código porque el backend devuelve 403 para
 * DOS situaciones con remedios opuestos:
 *   - auth.middleware.js  -> "Token inválido o expirado."      => hay que reloguear
 *   - role.middleware.js  -> "No tienes permisos para..."       => la sesión vale
 *
 * Si se tratan igual, un usuario 'Inventario' que pulse un botón reservado al
 * Administrador saldría expulsado de la aplicación.
 */

/** Error con respuesta del servidor. */
export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly estado: number,
    /** El texto original del backend, útil en consola durante el desarrollo. */
    readonly mensajeCrudo?: string
  ) {
    super(message);
    this.name = "ErrorApi";
  }
}

/** La sesión ya no vale: token ausente, inválido o expirado. Hay que reloguear. */
export class ErrorSesion extends ErrorApi {
  constructor(message = "Tu sesión expiró. Vuelve a iniciar sesión.", estado = 401, crudo?: string) {
    super(message, estado, crudo);
    this.name = "ErrorSesion";
  }
}

/** La sesión vale, pero el rol no alcanza. NO debe cerrar la sesión. */
export class ErrorPermisos extends ErrorApi {
  constructor(message = "No tienes permisos para realizar esta acción.", crudo?: string) {
    super(message, 403, crudo);
    this.name = "ErrorPermisos";
  }
}

/**
 * El recurso no existe.
 *
 * Se lanza también cuando un PUT/PATCH responde 200 con cuerpo VACÍO: los
 * servicios del backend devuelven `result.rows[0]`, que es `undefined` si el id
 * no existía, y `res.json(undefined)` manda un 200 sin cuerpo. Sin este error,
 * la interfaz mostraría "guardado" para una escritura que no tocó nada.
 */
export class ErrorNoEncontrado extends ErrorApi {
  constructor(message = "El registro ya no existe. Actualiza la lista.", crudo?: string) {
    super(message, 404, crudo);
    this.name = "ErrorNoEncontrado";
  }
}

/** No se pudo contactar al servidor (el caso más común en desarrollo local). */
export class ErrorRed extends Error {
  constructor(
    message = "No se pudo conectar con el servidor. Verifica que el backend esté encendido."
  ) {
    super(message);
    this.name = "ErrorRed";
  }
}

/** true si el error obliga a volver a autenticarse. */
export function esErrorDeSesion(error: unknown): error is ErrorSesion {
  return error instanceof ErrorSesion;
}

/** Mensaje presentable para cualquier error que llegue a la interfaz. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi || error instanceof ErrorRed) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
