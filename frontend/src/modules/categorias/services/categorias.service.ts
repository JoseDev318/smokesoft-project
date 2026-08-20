import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { CategoriaFila } from "@/shared/types/bd.types";
import type { CategoriaDto } from "@/shared/types/dto.types";

export const categoriasService = {
  listar: () => api.get<CategoriaFila[]>(ENDPOINTS.categorias.lista),
  obtener: (id: number) => api.get<CategoriaFila>(ENDPOINTS.categorias.uno(id)),
  crear: (dto: CategoriaDto) => api.post<CategoriaFila>(ENDPOINTS.categorias.lista, dto),
  actualizar: (id: number, dto: CategoriaDto) =>
    api.put<CategoriaFila>(ENDPOINTS.categorias.uno(id), dto),
  eliminar: (id: number) => api.del(ENDPOINTS.categorias.uno(id)),
};
