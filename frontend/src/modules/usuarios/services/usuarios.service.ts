import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { UsuarioFila } from "@/shared/types/bd.types";
import type { ActualizarUsuarioDto, CrearUsuarioDto } from "@/shared/types/dto.types";

export const usuariosService = {
  /**
   * Por defecto el backend excluye las cuentas de tienda (rol='Cliente'): son
   * filas en `usuario` igual que el personal, y sin ese filtro inundarían la
   * grilla del panel.
   */
  listar: () => api.get<UsuarioFila[]>(ENDPOINTS.usuarios.lista),

  obtener: (id: number) => api.get<UsuarioFila>(ENDPOINTS.usuarios.uno(id)),

  crear: (dto: CrearUsuarioDto) => api.post<UsuarioFila>(ENDPOINTS.usuarios.lista, dto),

  /** El PUT no toca `usuario` ni `clave`: no hay endpoint de cambio de clave. */
  actualizar: (id: number, dto: ActualizarUsuarioDto) =>
    api.put<UsuarioFila>(ENDPOINTS.usuarios.uno(id), dto),

  cambiarEstado: (id: number, estado: boolean) =>
    api.patch<UsuarioFila>(ENDPOINTS.usuarios.estado(id), { estado }),

  eliminar: (id: number) => api.del(ENDPOINTS.usuarios.uno(id)),
};
