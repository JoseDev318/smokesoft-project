"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import { mensajeDeError } from "@/shared/api/errores";
import { DialogoConfirmar } from "@/shared/components/ui/DialogoConfirmar";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, EstadoVacio, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { formatearMoneda } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { VentaFila } from "@/shared/types/bd.types";
import { ventasService } from "../services/ventas.service";

/** Historial de ventas. Equivale al "Historial de Compras" del guía. */
export function VistaVentas() {
  const { usuario } = useSesion();
  const rol = usuario?.rol;
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [aAnular, setAAnular] = useState<VentaFila | null>(null);
  const termino = useDebounce(busqueda);

  const consulta = useQuery({ queryKey: ["ventas"], queryFn: ventasService.listar });

  const anular = useMutation({
    mutationFn: (venta: VentaFila) => ventasService.anular(venta.id_venta),
    onSuccess: () => {
      avisos.exito("Venta anulada y stock devuelto al inventario");
      void clienteQuery.invalidateQueries({ queryKey: ["ventas"] });
      // El stock volvió: productos, catálogo y dashboard quedaron obsoletos.
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
    },
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  // Memorizado para que el `?? []` no cree un array nuevo en cada render y
  // dispare el useMemo de abajo sin necesidad.
  const ventas = useMemo(() => consulta.data ?? [], [consulta.data]);

  const visibles = useMemo(() => {
    const texto = termino.trim().toLowerCase();
    if (!texto) return ventas;
    return ventas.filter(
      (venta) =>
        (venta.cliente_nombre ?? "").toLowerCase().includes(texto) ||
        String(venta.id_venta).includes(texto)
    );
  }, [ventas, termino]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5rem] font-semibold text-texto">Ventas</h1>
        {puede(rol, "ventas", "escribir") && (
          <Link href={RUTAS.panelVentaNueva} className="btn btn-acento">
            + Nueva Venta
          </Link>
        )}
      </div>

      {consulta.error && (
        <div className="mb-5">
          <MensajeError
            mensaje={mensajeDeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        </div>
      )}

      <Tarjeta>
        <CabeceraTarjeta titulo="Historial de Ventas" />

        <label className="mb-4 block">
          <span className="sr-only">Buscar ventas</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por cliente o número…"
            className="w-full rounded-admin border border-borde bg-superficie-alta px-3.5 py-2.5 text-[0.95rem] text-texto placeholder:text-texto-tenue focus:border-acento focus:outline-none"
          />
        </label>

        {consulta.isLoading ? (
          <Cargando />
        ) : ventas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay ventas"
            mensaje="Registra la primera desde el botón Nueva Venta."
          />
        ) : (
          <>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>ID</th><th>Cliente</th><th>Vendedor</th><th>Fecha</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.length === 0 ? (
                    <tr><td colSpan={8} className="celda-vacia">Ningún resultado</td></tr>
                  ) : (
                    visibles.map((venta) => (
                      <tr key={venta.id_venta}>
                        <td>#{String(venta.id_venta).padStart(3, "0")}</td>
                        <td>{venta.cliente_nombre ?? "—"}</td>
                        <td>{venta.usuario_nombre ?? "—"}</td>
                        <td>{formatearFecha(venta.fecha)}</td>
                        <td className="celda-numerica">{formatearMoneda(venta.subtotal)}</td>
                        <td className="celda-numerica">{formatearMoneda(venta.iva)}</td>
                        <td className="celda-numerica font-semibold">{formatearMoneda(venta.total)}</td>
                        <td className="celda-acciones">
                          <Link
                            href={RUTAS.panelVenta(venta.id_venta)}
                            className="btn-accion btn-accion-ver"
                            aria-label={`Ver la venta ${venta.id_venta}`}
                            title="Ver detalle"
                          >
                            👁
                          </Link>
                          {puede(rol, "ventas", "borrar") && (
                            <button
                              type="button"
                              className="btn-accion btn-accion-eliminar"
                              onClick={() => setAAnular(venta)}
                              aria-label={`Anular la venta ${venta.id_venta}`}
                              title="Anular"
                            >
                              🗑
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[0.85rem] text-texto-tenue">
              Mostrando {visibles.length} de {ventas.length} ventas
            </p>
          </>
        )}
      </Tarjeta>

      <DialogoConfirmar
        abierto={aAnular !== null}
        titulo="Anular venta"
        textoConfirmar="Anular"
        procesando={anular.isPending}
        mensaje={
          aAnular
            ? `¿Anular la venta #${String(aAnular.id_venta).padStart(3, "0")} de ${aAnular.cliente_nombre ?? "—"}? El stock volverá al inventario.`
            : ""
        }
        onCancelar={() => setAAnular(null)}
        onConfirmar={() => {
          if (aAnular) anular.mutate(aAnular);
          setAAnular(null);
        }}
      />
    </div>
  );
}
