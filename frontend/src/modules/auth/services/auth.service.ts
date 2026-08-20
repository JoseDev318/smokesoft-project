import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { SesionUsuario } from "@/shared/api/sesionStore";
import type { SesionCompleta } from "@/shared/types/bd.types";
import type { LoginDto, RegistroClienteDto } from "@/shared/types/dto.types";

export interface RespuestaAuth {
  token: string;
  usuario: SesionUsuario;
}

export const authService = {
  /** POST /api/auth/login — público: aún no hay token que enviar. */
  ingresar: (dto: LoginDto) =>
    api.post<RespuestaAuth>(ENDPOINTS.auth.login, dto, { publico: true }),

  /**
   * POST /api/auth/registro — público. El backend fuerza rol='Cliente' y
   * devuelve un token, así que el visitante queda logueado de inmediato.
   */
  registrar: (dto: RegistroClienteDto) =>
    api.post<RespuestaAuth>(ENDPOINTS.auth.registro, dto, { publico: true }),

  /**
   * GET /api/auth/me — relee la base de datos, así que detecta una cuenta
   * deshabilitada a mitad de la vida del token. Es la comprobación fiable de
   * "¿sigo autenticado?", no un 401 del catálogo (que ahora es público).
   */
  sesionActual: () => api.get<SesionCompleta>(ENDPOINTS.auth.me),
};
