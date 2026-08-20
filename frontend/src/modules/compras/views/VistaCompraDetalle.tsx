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
import { comprasService } from "../services/compras.service";

export function VistaCompraDetalle({ id }: { id: number }) {
  const consulta = useQuery({
    queryKey: ["compras", id],
    queryFn: () => comprasService.obtener(id),
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

  const compra = consulta.data;
  if (!compra) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5rem] font-semibold text-texto">
          Compra #{String(compra.id_compra).padStart(3, "0")}
        </h1>
        <Link href={RUTAS.panelCompras} className="btn btn-neutro">
          Volver al historial
        </Link>
      </div>

      <div className="grid items-start gap-5 panel:grid-cols-[1fr_320px]">
        <Tarjeta>
          <CabeceraTarjeta titulo="Mercancía" />
          <div className="contenedor-tabla">
            <table className="tabla-modulo">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Costo unit.</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {compra.detalles.length === 0 ? (
                  <tr><td colSpan={4} className="celda-vacia">Sin líneas registradas</td></tr>
                ) : (
                  compra.detalles.map((detalle) => (
                    <tr key={detalle.id_detalle}>
                      <td>{detalle.producto_nombre}</td>
                      <td className="celda-numerica">{detalle.cantidad}</td>
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
              <div className="flex justify-between gap-4">
                <dt className="text-texto-apagado">Proveedor</dt>
                <dd className="text-right text-texto">{compra.proveedor_nombre ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-texto-apagado">Registró</dt>
                <dd className="text-right text-texto">{compra.usuario_nombre ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-texto-apagado">Fecha</dt>
                <dd className="text-right text-texto">{formatearFechaLarga(compra.fecha)}</dd>
              </div>
              {compra.notas && (
                <div className="flex justify-between gap-4">
                  <dt className="text-texto-apagado">Notas</dt>
                  <dd className="text-right text-texto">{compra.notas}</dd>
                </div>
              )}
            </dl>
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta titulo="Total" />
            <ResumenTotales
              subtotal={aNumero(compra.total)}
              total={aNumero(compra.total)}
              conIva={false}
            />
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
