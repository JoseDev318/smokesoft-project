"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { mensajeDeError } from "@/shared/api/errores";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { aNumero, formatearMoneda } from "@/shared/lib/dinero";
import { formatearFechaLarga } from "@/shared/lib/fechas";
import { ventasService } from "../services/ventas.service";

/** Detalle de una venta con sus líneas. Sustituye el `alert()` del guía. */
export function VistaVentaDetalle({ id }: { id: number }) {
  const consulta = useQuery({
    queryKey: ["ventas", id],
    queryFn: () => ventasService.obtener(id),
  });

  if (consulta.isLoading) return <Cargando />;

  if (consulta.error) {
    return (
      <MensajeError
        mensaje={mensajeDeError(consulta.error)}
        onReintentar={() => void consulta.refetch()}
      />
    );
  }

  const venta = consulta.data;
  if (!venta) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5rem] font-semibold text-texto">
          Venta #{String(venta.id_venta).padStart(3, "0")}
        </h1>
        <Link href={RUTAS.panelVentas} className="btn btn-neutro">
          Volver al historial
        </Link>
      </div>

      <div className="grid items-start gap-5 panel:grid-cols-[1fr_320px]">
        <Tarjeta>
          <CabeceraTarjeta titulo="Productos" />
          <div className="contenedor-tabla">
            <table className="tabla-modulo">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Precio unit.</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles.length === 0 ? (
                  <tr><td colSpan={4} className="celda-vacia">Sin líneas registradas</td></tr>
                ) : (
                  venta.detalles.map((detalle) => (
                    <tr key={detalle.id_detalle}>
                      <td>{detalle.producto_nombre}</td>
                      <td className="celda-numerica">{detalle.cantidad}</td>
                      {/* El precio unitario guardado congela el histórico: si el
                          producto cambia de precio, esta factura no se reescribe. */}
                      <td className="celda-numerica">{formatearMoneda(detalle.precio_unitario)}</td>
                      <td className="celda-numerica">{formatearMoneda(detalle.subtotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <div className="flex flex-col gap-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Datos" />
            <dl className="space-y-2.5 text-sm">
              <Dato etiqueta="Cliente" valor={venta.cliente_nombre ?? "—"} />
              <Dato etiqueta="Vendedor" valor={venta.usuario_nombre ?? "—"} />
              <Dato etiqueta="Fecha" valor={formatearFechaLarga(venta.fecha)} />
              {venta.notas && <Dato etiqueta="Notas" valor={venta.notas} />}
            </dl>
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta titulo="Totales" />
            {/* Se muestran los totales ALMACENADOS, no un recálculo: la tasa de
                IVA pudo cambiar desde que se emitió la venta. */}
            <ResumenTotales
              subtotal={aNumero(venta.subtotal)}
              iva={aNumero(venta.iva)}
              total={aNumero(venta.total)}
            />
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-texto-apagado">{etiqueta}</dt>
      <dd className="text-right text-texto">{valor}</dd>
    </div>
  );
}
