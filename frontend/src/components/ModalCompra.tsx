"use client";

import { useState } from "react";
import type { Proveedor } from "@/types/proveedor";
import type { Producto } from "@/types/producto";
import type { LineaCompra } from "@/types/compra";

type Props = {
  proveedores: Proveedor[];
  productos: Producto[];
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalCompra({
  proveedores,
  productos,
  onClose,
  onGuardado,
}: Props) {
  const [idProveedor, setIdProveedor] = useState("");
  const [lineas, setLineas] = useState<LineaCompra[]>([
    { id_producto: 0, cantidad: 1, precio_unitario: 0 },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function agregarLinea() {
    setLineas([...lineas, { id_producto: 0, cantidad: 1, precio_unitario: 0 }]);
  }

  function quitarLinea(index: number) {
    setLineas(lineas.filter((_, i) => i !== index));
  }

  function actualizarLinea(index: number, cambios: Partial<LineaCompra>) {
    setLineas(
      lineas.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea))
    );
  }

  const total = lineas.reduce(
    (suma, l) => suma + l.cantidad * l.precio_unitario,
    0
  );

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!idProveedor) {
      setError("Selecciona un proveedor.");
      return;
    }
    if (lineas.some((l) => !l.id_producto || l.cantidad <= 0)) {
      setError("Completa todos los productos y cantidades correctamente.");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_proveedor: Number(idProveedor),
          productos: lineas,
        }),
      });

      if (!res.ok) throw new Error();

      onGuardado();
    } catch {
      setError("No se pudo registrar la compra. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-hueso">
          Nueva compra
        </h2>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs text-humo">Proveedor</label>
            <select
              value={idProveedor}
              onChange={(e) => setIdProveedor(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-humo">Productos</label>
            <div className="flex flex-col gap-2">
              {lineas.map((linea, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={linea.id_producto || ""}
                    onChange={(e) =>
                      actualizarLinea(index, { id_producto: Number(e.target.value) })
                    }
                    className="flex-1 rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
                  >
                    <option value="">Producto</option>
                    {productos.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    placeholder="Cant."
                    value={linea.cantidad || ""}
                    onChange={(e) =>
                      actualizarLinea(index, { cantidad: Number(e.target.value) })
                    }
                    className="w-20 rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
                  />

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Precio unit."
                    value={linea.precio_unitario || ""}
                    onChange={(e) =>
                      actualizarLinea(index, { precio_unitario: Number(e.target.value) })
                    }
                    className="w-28 rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
                  />

                  <button
                    type="button"
                    onClick={() => quitarLinea(index)}
                    disabled={lineas.length === 1}
                    className="text-xs font-medium text-red-400 hover:underline disabled:opacity-30"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-2 text-xs font-medium text-turquesa hover:underline"
            >
              + Agregar producto
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-humo">Total</span>
            <span className="font-display text-lg font-bold text-hueso">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              }).format(total)}
            </span>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-humo hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon hover:bg-turquesa-dim disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Registrar compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}