import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { ClienteFila, VentaFila } from "@/shared/types/bd.types";
import type { ClienteDto } from "@/shared/types/dto.types";

export const clientesService = {
  listar: () => api.get<ClienteFila[]>(ENDPOINTS.clientes.lista),
  obtener: (id: number) => api.get<ClienteFila>(ENDPOINTS.clientes.uno(id)),
  crear: (dto: ClienteDto) => api.post<ClienteFila>(ENDPOINTS.clientes.lista, dto),
  actualizar: (id: number, dto: ClienteDto) =>
    api.put<ClienteFila>(ENDPOINTS.clientes.uno(id), dto),
  eliminar: (id: number) => api.del(ENDPOINTS.clientes.uno(id)),
  ventasDe: (id: number) => api.get<VentaFila[]>(ENDPOINTS.clientes.ventasDe(id)),

  // Autogestión del cliente de la tienda: el id sale del token, no de la URL.
  miFicha: () => api.get<ClienteFila>(ENDPOINTS.clientes.mio),
  actualizarMiFicha: (dto: ClienteDto) => api.put<ClienteFila>(ENDPOINTS.clientes.mio, dto),
};
