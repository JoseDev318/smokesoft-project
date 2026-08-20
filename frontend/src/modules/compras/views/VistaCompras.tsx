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
import type { CompraFila } from "@/shared/types/bd.types";
import { comprasService } from "../services/compras.service";

/** Historial de compras a proveedor. */
export function VistaCompras() {
  const { usuario } = useSesion();
  const rol = usuario?.rol;
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [aAnular, setAAnular] = useState<CompraFila | null>(null);
  const termino = useDebounce(busqueda);

  const consulta = useQuery({ queryKey: ["compras"], queryFn: comprasService.listar });

  const anular = useMutation({
    mutationFn: (compra: CompraFila) => comprasService.anular(compra.id_compra),
    onSuccess: () => {
      avisos.exito("Compra anulada y stock revertido");
      void clienteQuery.invalidateQueries({ queryKey: ["compras"] });
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
    },
    // El backend responde 409 si la mercancía ya se vendió: restar dejaría el
    // inventario en negativo. Es un rechazo correcto, no un fallo.
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  // Memorizado para que el `?? []` no cree un array nuevo en cada render y
  // dispare el useMemo de abajo sin necesidad.
  const compras = useMemo(() => consulta.data ?? [], [consulta.data]);

  const visibles = useMemo(() => {
    const texto = termino.trim().toLowerCase();
    if (!texto) return compras;
    return compras.filter(
      (compra) =>
        (compra.proveedor_nombre ?? "").toLowerCase().includes(texto) ||
        String(compra.id_compra).includes(texto)
    );
  }, [compras, termino]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-semibold text-texto">Compras a proveedor</h1>
          <p className="mt-1 text-sm text-texto-apagado">
            Entradas de mercancía: cada compra suma stock al inventario.
          </p>
        </div>
        {puede(rol, "compras", "escribir") && (
          <Link href={RUTAS.panelCompraNueva} className="btn btn-acento">
            + Nueva Compra
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
        <CabeceraTarjeta titulo="Historial de Compras" />

        <label className="mb-4 block">
          <span className="sr-only">Buscar compras</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por proveedor o número…"
            className="w-full rounded-admin border border-borde bg-superficie-alta px-3.5 py-2.5 text-[0.95rem] text-texto placeholder:text-texto-tenue focus:border-acento focus:outline-none"
          />
        </label>

        {consulta.isLoading ? (
          <Cargando />
        ) : compras.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay compras"
            mensaje="Registra la primera entrada de mercancía."
          />
        ) : (
          <>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>ID</th><th>Proveedor</th><th>Registró</th><th>Fecha</th>
                    <th className="text-right">Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.length === 0 ? (
                    <tr><td colSpan={6} className="celda-vacia">Ningún resultado</td></tr>
                  ) : (
                    visibles.map((compra) => (
                      <tr key={compra.id_compra}>
                        <td>#{String(compra.id_compra).padStart(3, "0")}</td>
                        <td>{compra.proveedor_nombre ?? "—"}</td>
                        <td>{compra.usuario_nombre ?? "—"}</td>
                        <td>{formatearFecha(compra.fecha)}</td>
                        <td className="celda-numerica font-semibold">
                          {formatearMoneda(compra.total)}
                        </td>
                        <td className="celda-acciones">
                          <Link
                            href={RUTAS.panelCompra(compra.id_compra)}
                            className="btn-accion btn-accion-ver"
                            aria-label={`Ver la compra ${compra.id_compra}`}
                            title="Ver detalle"
                          >
                            👁
                          </Link>
                          {puede(rol, "compras", "borrar") && (
                            <button
                              type="button"
                              className="btn-accion btn-accion-eliminar"
                              onClick={() => setAAnular(compra)}
                              aria-label={`Anular la compra ${compra.id_compra}`}
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
              Mostrando {visibles.length} de {compras.length} compras
            </p>
          </>
        )}
      </Tarjeta>

      <DialogoConfirmar
        abierto={aAnular !== null}
        titulo="Anular compra"
        textoConfirmar="Anular"
        procesando={anular.isPending}
        mensaje={
          aAnular
            ? `¿Anular la compra #${String(aAnular.id_compra).padStart(3, "0")}? Se restará el stock que había ingresado. Si esa mercancía ya se vendió, la operación será rechazada.`
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
