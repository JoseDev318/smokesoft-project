"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ventasService } from "@/modules/ventas/services/ventas.service";
import { mensajeDeError } from "@/shared/api/errores";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, EstadoVacio, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { formatearMoneda } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";

/**
 * Historial completo de pedidos del cliente.
 *
 * El guía mostraba una columna "Estado" con valores fijos ("Entregado", "En
 * tránsito") pintados con `color: green` inline. La tabla `venta` no tiene
 * columna de estado, así que no se inventa: se muestra lo que sí existe. Añadir
 * seguimiento requeriría un `estado` en `venta` (sería la migración 006).
 */
export function VistaMisPedidos() {
  const consulta = useQuery({ queryKey: ["ventas", "mias"], queryFn: ventasService.mias });

  const pedidos = consulta.data ?? [];

  return (
    <div className="mx-auto w-[90%] max-w-[900px] px-5 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.8rem] font-bold text-acento">Mis pedidos</h1>
        <Link href={RUTAS.perfil} className="btn btn-neutro">Volver al perfil</Link>
      </div>

      <Tarjeta>
        <CabeceraTarjeta titulo="Historial de compras" />

        {consulta.isLoading ? (
          <Cargando />
        ) : consulta.error ? (
          <MensajeError
            mensaje={mensajeDeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        ) : pedidos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no has hecho pedidos"
            mensaje="Cuando compres algo, aparecerá aquí."
          >
            <Link href={RUTAS.productos} className="btn btn-acento">Ver productos</Link>
          </EstadoVacio>
        ) : (
          <>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>Pedido</th><th>Fecha</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id_venta}>
                      <td>#{String(pedido.id_venta).padStart(3, "0")}</td>
                      <td>{formatearFecha(pedido.fecha)}</td>
                      <td className="celda-numerica">{formatearMoneda(pedido.subtotal)}</td>
                      <td className="celda-numerica">{formatearMoneda(pedido.iva)}</td>
                      <td className="celda-numerica font-semibold">
                        {formatearMoneda(pedido.total)}
                      </td>
                      <td className="celda-acciones">
                        <Link
                          href={RUTAS.miPedido(pedido.id_venta)}
                          className="btn-accion btn-accion-ver"
                          aria-label={`Ver el pedido ${pedido.id_venta}`}
                          title="Ver detalle"
                        >
                          👁
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[0.85rem] text-texto-tenue">
              {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} en total
            </p>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
