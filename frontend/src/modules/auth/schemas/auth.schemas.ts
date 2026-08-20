import { z } from "zod";

/**
 * Validación en el navegador.
 *
 * No es opcional: el backend original no tiene capa de validación (sus
 * controladores pasan `req.body` directo a `pool.query`), así que sin esto un
 * campo vacío se convierte en un 500 con el texto crudo de Postgres.
 *
 * Los límites de longitud replican los VARCHAR del esquema, para que el error
 * salga aquí y no como "value too long for type character varying(150)".
 */

export const esquemaLogin = z.object({
  usuario: z.string().trim().min(1, "Escribe tu usuario").max(50, "Máximo 50 caracteres"),
  clave: z.string().min(1, "Escribe tu contraseña"),
});

export type FormularioLogin = z.infer<typeof esquemaLogin>;

export const esquemaRegistro = z
  .object({
    correo: z
      .string()
      .trim()
      .min(1, "El correo es obligatorio")
      .email("Escribe un correo válido")
      .max(150, "Máximo 150 caracteres"),
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
    apellidos: z.string().trim().min(1, "Los apellidos son obligatorios").max(69, "Máximo 69 caracteres"),
    tipo_documento: z.enum(["CC", "TI", "CE"]),
    documento: z
      .string()
      .trim()
      .min(5, "El documento debe tener al menos 5 caracteres")
      .max(30, "Máximo 30 caracteres")
      .regex(/^[0-9A-Za-z-]+$/, "Solo números, letras y guiones"),
    celular: z
      .string()
      .trim()
      .min(7, "El celular debe tener al menos 7 dígitos")
      .max(20, "Máximo 20 caracteres"),
    direccion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
    usuario: z
      .string()
      .trim()
      .min(4, "El usuario debe tener al menos 4 caracteres")
      .max(50, "Máximo 50 caracteres")
      .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo"),
    // El backend exige 8: mismo mínimo aquí para que el error salga antes de
    // llegar al servidor.
    clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmarClave: z.string().min(1, "Repite la contraseña"),
  })
  // nombre + apellidos se unen en `cliente.nombre`, que es VARCHAR(150).
  .refine((datos) => `${datos.nombre} ${datos.apellidos}`.trim().length <= 150, {
    message: "El nombre completo no puede superar los 150 caracteres",
    path: ["apellidos"],
  })
  .refine((datos) => datos.clave === datos.confirmarClave, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarClave"],
  });

export type FormularioRegistro = z.infer<typeof esquemaRegistro>;
