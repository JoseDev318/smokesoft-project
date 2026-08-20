import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type {
  CompraDetallada, CompraFila, EstadisticasCompras,
} from "@/shared/types/bd.types";
import type { CrearCompraDto } from "@/shared/types/dto.types";

/**
 * Compras a PROVEEDOR: entrada de mercancía, suma stock.
 *
 * No confundir con el módulo "Compras" del proyecto guía, que en realidad
 * modelaba ventas a clientes (ver modules/ventas).
 */
export const comprasService = {
  listar: () => api.get<CompraFila[]>(ENDPOINTS.compras.lista),

  obtener: (id: number) => api.get<CompraDetallada>(ENDPOINTS.compras.uno(id)),

  /** El costo unitario lo fija el proveedor, así que va en el cuerpo. */
  crear: (dto: CrearCompraDto) => api.post<CompraDetallada>(ENDPOINTS.compras.lista, dto),

  /**
   * Anular RESTA stock, así que puede fallar con 409 si la mercancía ya se
   * vendió. Es correcto: dejaría el inventario en negativo.
   */
  anular: (id: number) => api.del(ENDPOINTS.compras.uno(id)),

  estadisticas: () => api.get<EstadisticasCompras>(ENDPOINTS.compras.estadisticas),
};
