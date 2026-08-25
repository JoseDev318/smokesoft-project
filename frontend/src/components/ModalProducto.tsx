"use client";

import { useState } from "react";
import type { Producto, Categoria, Proveedor } from "@/types/producto";

type Props = {
  modo: "crear" | "editar";
  productoInicial?: Producto;
  categorias: Categoria[];
  proveedores: Proveedor[];
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalProducto({
  modo,
  productoInicial,
  categorias,
  proveedores,
  onClose,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState(productoInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoInicial?.descripcion ?? "");
  const [precio, setPrecio] = useState(productoInicial?.precio ?? "");
  const [stockMinimo, setStockMinimo] = useState(
    productoInicial?.stock_minimo?.toString() ?? "0"
  );
  const [idCategoria, setIdCategoria] = useState(
    productoInicial?.id_categoria?.toString() ?? ""
  );
  const [idProveedor, setIdProveedor] = useState(
    productoInicial?.id_proveedor?.toString() ?? ""
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const payload = {
      nombre,
      descripcion,
      precio: Number(precio),
      stock_minimo: Number(stockMinimo),
      id_categoria: idCategoria ? Number(idCategoria) : null,
      id_proveedor: idProveedor ? Number(idProveedor) : null,
    };

    const url =
      modo === "crear"
        ? "/api/productos"
        : `/api/productos/${productoInicial?.id_producto}`;
    const method = modo === "crear" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      onGuardado(); // avisa al padre (ProductosClient) que ya puede refrescar la tabla
    } catch {
      setError("No se pudo guardar el producto. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-hueso">
          {modo === "crear" ? "Nuevo producto" : "Editar producto"}
        </h2>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-humo">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Descripción</label>
            <textarea
              value={descripcion ?? ""}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-humo">Precio</label>
              <input
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-humo">Stock mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Categoría</label>
            <select
              value={idCategoria}
              onChange={(e) => setIdCategoria(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Proveedor</label>
            <select
              value={idProveedor}
              onChange={(e) => setIdProveedor(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
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
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}