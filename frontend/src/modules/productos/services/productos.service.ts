import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { ProductoFila, ResumenProductos } from "@/shared/types/bd.types";
import type {
  ActualizarProductoDto, AjusteStockDto, CrearProductoDto,
} from "@/shared/types/dto.types";

export const productosService = {
  /** `incluirInactivos` solo surte efecto para Administrador e Inventario. */
  listar: (incluirInactivos = false) =>
    api.get<ProductoFila[]>(
      incluirInactivos
        ? `${ENDPOINTS.productos.lista}?incluirInactivos=true`
        : ENDPOINTS.productos.lista
    ),

  obtener: (id: number) => api.get<ProductoFila>(ENDPOINTS.productos.uno(id)),

  crear: (dto: CrearProductoDto) => api.post<ProductoFila>(ENDPOINTS.productos.lista, dto),

  /** PUT es reemplazo total: hay que enviar todos los campos o se guardan NULL. */
  actualizar: (id: number, dto: ActualizarProductoDto) =>
    api.put<ProductoFila>(ENDPOINTS.productos.uno(id), dto),

  cambiarEstado: (id: number, activo: boolean) =>
    api.patch<ProductoFila>(ENDPOINTS.productos.estado(id), { activo }),

  /** `cantidad` es un delta con signo. */
  ajustarStock: (id: number, dto: AjusteStockDto) =>
    api.patch<ProductoFila>(ENDPOINTS.productos.stock(id), dto),

  stockBajo: () => api.get<ProductoFila[]>(ENDPOINTS.productos.stockBajo),

  resumen: () => api.get<ResumenProductos>(ENDPOINTS.productos.resumen),

  eliminar: (id: number) => api.del(ENDPOINTS.productos.uno(id)),
};
