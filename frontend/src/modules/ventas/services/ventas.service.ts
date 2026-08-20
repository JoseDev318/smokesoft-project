import { api } from "@/shared/api/cliente";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type {
  EstadisticasVentas, ResumenPorCliente, VentaDetallada, VentaFila,
} from "@/shared/types/bd.types";
import type { CrearVentaDto } from "@/shared/types/dto.types";

export const ventasService = {
  listar: () => api.get<VentaFila[]>(ENDPOINTS.ventas.lista),

  obtener: (id: number) => api.get<VentaDetallada>(ENDPOINTS.ventas.uno(id)),

  /**
   * El backend calcula subtotal, IVA y total desde los precios de la base de
   * datos, y descuenta el stock en una transacción. Si algo falla (stock
   * insuficiente, producto inactivo) responde 409 y NADA se guarda.
   *
   * No existe actualizar(): editar una venta implicaría revertir stock y
   * reaplicarlo. Para corregir una, se anula y se vuelve a crear.
   */
  crear: (dto: CrearVentaDto) => api.post<VentaDetallada>(ENDPOINTS.ventas.lista, dto),

  /** Devuelve el stock al inventario. */
  anular: (id: number) => api.del(ENDPOINTS.ventas.uno(id)),

  estadisticas: () => api.get<EstadisticasVentas>(ENDPOINTS.ventas.estadisticas),

  recientes: (limite = 5) =>
    api.get<VentaFila[]>(`${ENDPOINTS.ventas.recientes}?limite=${limite}`),

  porCliente: () => api.get<ResumenPorCliente[]>(ENDPOINTS.ventas.porCliente),

  // Pedidos del cliente autenticado. El id_cliente sale del token.
  mias: () => api.get<VentaFila[]>(ENDPOINTS.ventas.mias),
  miaPorId: (id: number) => api.get<VentaDetallada>(ENDPOINTS.ventas.miaUna(id)),
};
