"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalProducto from "@/components/ModalProducto";
import type { Producto, Categoria, Proveedor } from "@/types/producto";

type Props = {
  productos: Producto[];
  categorias: Categoria[];
  proveedores: Proveedor[];
};

export default function ProductosClient({ productos, categorias, proveedores }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [productoEditando, setProductoEditando] = useState<Producto | undefined>();
  const [eliminando, setEliminando] = useState<number | null>(null);

  function abrirCrear() {
    setProductoEditando(undefined);
    setModalAbierto("crear");
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setModalAbierto("editar");
  }

  function cerrarModal() {
    setModalAbierto(null);
  }

  function alGuardar() {
    cerrarModal();
    router.refresh(); // vuelve a correr page.tsx en el servidor y trae datos frescos
  }

  async function eliminarProducto(id: number) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;

    setEliminando(id);
    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo eliminar. Verifica tu rol o intenta de nuevo.");
    } finally {
      setEliminando(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-hueso">Productos</h1>
          <p className="text-sm text-humo">Inventario general de SmokeSoft.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {productos.map((producto) => {
              const stockBajo = producto.stock <= producto.stock_minimo;

              return (
                <tr key={producto.id_producto} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-hueso">{producto.nombre}</p>
                    {producto.descripcion && (
                      <p className="line-clamp-1 text-xs text-humo/60">
                        {producto.descripcion}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-humo">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    }).format(Number(producto.precio))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={stockBajo ? "font-semibold text-red-400" : "text-humo"}>
                      {producto.stock}
                    </span>
                    {stockBajo && (
                      <span className="ml-2 rounded-full bg-red-400/10 px-2 py-0.5 text-xs text-red-400">
                        Stock bajo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        producto.activo
                          ? "bg-turquesa/10 text-turquesa"
                          : "bg-white/5 text-humo/60"
                      }`}
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(producto)}
                      className="mr-3 text-xs font-medium text-turquesa hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.id_producto)}
                      disabled={eliminando === producto.id_producto}
                      className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                    >
                      {eliminando === producto.id_producto ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-humo/60">
                  No hay productos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalProducto
          modo={modalAbierto}
          productoInicial={productoEditando}
          categorias={categorias}
          proveedores={proveedores}
          onClose={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}