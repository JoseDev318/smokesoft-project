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

/** Pedido confirmado. Se llega por `replace`, así que Atrás no reenvía nada. */
export function VistaConfirmacion({ idVenta }: { idVenta: number }) {
  // Endpoint propio del cliente: comprueba que el pedido le pertenezca.
  const consulta = useQuery({
    queryKey: ["ventas", "mias", idVenta],
    queryFn: () => ventasService.miaPorId(idVenta),
  });

  return (
    <div className="mx-auto w-[90%] max-w-[720px] px-5 py-10">
      <div className="mb-6 text-center">
        <p className="text-[3rem]" aria-hidden="true">✅</p>
        <h1 className="mb-2 text-[1.8rem] font-bold text-acento">¡Pedido confirmado!</h1>
        <p className="text-texto-secundario">
          Tu pedido <strong className="text-texto">#{String(idVenta).padStart(3, "0")}</strong> quedó
          registrado. Nos pondremos en contacto para coordinar la entrega.
        </p>
      </div>

      {consulta.isLoading && <Cargando />}

      {consulta.error && (
        <MensajeError
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      )}

      {consulta.data && (
        <Tarjeta>
          <CabeceraTarjeta titulo="Detalle del pedido" />

          <p className="mb-4 text-sm text-texto-apagado">
            {formatearFechaLarga(consulta.data.fecha)}
          </p>

          <div className="contenedor-tabla mb-4">
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

          {/* Totales tal como los guardó el servidor, no un recálculo. */}
          <ResumenTotales
            subtotal={aNumero(consulta.data.subtotal)}
            iva={aNumero(consulta.data.iva)}
            total={aNumero(consulta.data.total)}
          />
        </Tarjeta>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link href={RUTAS.misPedidos} className="btn btn-acento">
          Ver mis pedidos
        </Link>
        <Link href={RUTAS.productos} className="btn btn-neutro">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
