"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import ModalCompra from "@/components/ModalCompra";
import type { Compra, DetalleCompra } from "@/types/compra";
import type { Proveedor } from "@/types/proveedor";
import type { Producto } from "@/types/producto";

type Props = {
  compras: Compra[];
  proveedores: Proveedor[];
  productos: Producto[];
};

const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ComprasClient({ compras, proveedores, productos }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<DetalleCompra[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  function alGuardar() {
    setModalAbierto(false);
    router.refresh();
  }

  async function alternarExpandir(idCompra: number) {
    if (expandida === idCompra) {
      setExpandida(null);
      return;
    }

    setExpandida(idCompra);
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/compras/${idCompra}`);
      const data = await res.json();
      setDetalle(data.detalle ?? []);
    } catch {
      setDetalle([]);
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-hueso">Compras</h1>
          <p className="text-sm text-humo">Historial de entradas de inventario.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nueva compra
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {compras.map((compra) => (
              <Fragment key={compra.id_compra}>
                <tr className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-humo">
                    {new Date(compra.fecha).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 font-medium text-hueso">
                    {compra.nombre_proveedor}
                  </td>
                  <td className="px-4 py-3 text-right text-humo">
                    {formatoMoneda.format(Number(compra.total))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alternarExpandir(compra.id_compra)}
                      className="text-xs font-medium text-turquesa hover:underline"
                    >
                      {expandida === compra.id_compra ? "Ocultar" : "Ver productos"}
                    </button>
                  </td>
                </tr>

                {expandida === compra.id_compra && (
                  <tr>
                    <td colSpan={4} className="bg-carbon px-4 py-3">
                      {cargandoDetalle ? (
                        <p className="text-xs text-humo/60">Cargando...</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="text-humo/60">
                            <tr>
                              <th className="pb-2 text-left">Producto</th>
                              <th className="pb-2 text-right">Cantidad</th>
                              <th className="pb-2 text-right">Precio unitario</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {detalle.map((linea) => (
                              <tr key={linea.id_detalle}>
                                <td className="py-2 text-hueso">{linea.nombre_producto}</td>
                                <td className="py-2 text-right text-humo">
                                  {linea.cantidad}
                                </td>
                                <td className="py-2 text-right text-humo">
                                  {formatoMoneda.format(
                                    Number(linea.subtotal) / linea.cantidad
                                  )}
                                </td>
                                <td className="py-2 text-right text-humo">
                                  {formatoMoneda.format(Number(linea.subtotal))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {compras.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-humo/60">
                  No hay compras registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalCompra
          proveedores={proveedores}
          productos={productos}
          onClose={() => setModalAbierto(false)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}