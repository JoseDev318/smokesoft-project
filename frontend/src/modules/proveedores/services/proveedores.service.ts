import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { ProveedorFila } from "@/shared/types/bd.types";
import type { ProveedorDto } from "@/shared/types/dto.types";

export const proveedoresService = {
  listar: () => api.get<ProveedorFila[]>(ENDPOINTS.proveedores.lista),
  obtener: (id: number) => api.get<ProveedorFila>(ENDPOINTS.proveedores.uno(id)),
  crear: (dto: ProveedorDto) => api.post<ProveedorFila>(ENDPOINTS.proveedores.lista, dto),
  actualizar: (id: number, dto: ProveedorDto) =>
    api.put<ProveedorFila>(ENDPOINTS.proveedores.uno(id), dto),
  eliminar: (id: number) => api.del(ENDPOINTS.proveedores.uno(id)),
};
