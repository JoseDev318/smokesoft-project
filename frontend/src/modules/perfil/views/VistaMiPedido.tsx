"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ventasService } from "@/modules/ventas/services/ventas.service";
import { mensajeDeError } from "@/shared/api/errores";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { aNumero, formatearMoneda } from "@/shared/lib/dinero";
import { formatearFechaLarga } from "@/shared/lib/fechas";

/** Detalle de un pedido propio. Reemplaza el `href="#"` de "Seguimiento". */
export function VistaMiPedido({ id }: { id: number }) {
  // Endpoint propio del cliente: el backend comprueba que el pedido sea suyo y
  // responde 404 si es de otra persona (sin revelar que existe).
  const consulta = useQuery({
    queryKey: ["ventas", "mias", id],
    queryFn: () => ventasService.miaPorId(id),
  });

  return (
    <div className="mx-auto w-[90%] max-w-[800px] px-5 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.8rem] font-bold text-acento">
          Pedido #{String(id).padStart(3, "0")}
        </h1>
        <Link href={RUTAS.misPedidos} className="btn btn-neutro">Volver a mis pedidos</Link>
      </div>

      {consulta.isLoading && <Cargando />}

      {consulta.error && (
        <MensajeError
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      )}

      {consulta.data && (
        <div className="flex flex-col gap-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Productos" />
            <p className="mb-4 text-sm text-texto-apagado">
              {formatearFechaLarga(consulta.data.fecha)}
            </p>

            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {consulta.data.detalles.map((detalle) => (
                    <tr key={detalle.id_detalle}>
                      <td>{detalle.producto_nombre}</td>
                      <td className="celda-numerica">{detalle.cantidad}</td>
                      <td className="celda-numerica">{formatearMoneda(detalle.precio_unitario)}</td>
                      <td className="celda-numerica">{formatearMoneda(detalle.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {consulta.data.notas && (
              <p className="mt-4 text-sm text-texto-secundario">
                <strong className="text-texto">Notas:</strong> {consulta.data.notas}
              </p>
            )}
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta titulo="Totales" />
            <ResumenTotales
              subtotal={aNumero(consulta.data.subtotal)}
              iva={aNumero(consulta.data.iva)}
              total={aNumero(consulta.data.total)}
            />
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
