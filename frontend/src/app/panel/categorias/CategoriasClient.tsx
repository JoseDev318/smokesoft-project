"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalCategoria from "@/components/ModalCategoria";
import type { Categoria } from "@/types/categoria";

type Props = {
  categorias: Categoria[];
};

export default function CategoriasClient({ categorias }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | undefined>();
  const [eliminando, setEliminando] = useState<number | null>(null);

  function abrirCrear() {
    setCategoriaEditando(undefined);
    setModalAbierto("crear");
  }

  function abrirEditar(categoria: Categoria) {
    setCategoriaEditando(categoria);
    setModalAbierto("editar");
  }

  function cerrarModal() {
    setModalAbierto(null);
  }

  function alGuardar() {
    cerrarModal();
    router.refresh();
  }

  async function eliminarCategoria(id: number) {
    if (!confirm("¿Eliminar esta categoría? Esta acción no se puede deshacer.")) return;

    setEliminando(id);
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
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
          <h1 className="font-display text-2xl font-bold text-hueso">Categorías</h1>
          <p className="text-sm text-humo">Clasificación de productos de SmokeSoft.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categorias.map((categoria) => (
              <tr key={categoria.id_categoria} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-hueso">{categoria.nombre}</td>
                <td className="px-4 py-3 text-humo">
                  {categoria.descripcion || (
                    <span className="text-humo/40">Sin descripción</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirEditar(categoria)}
                    className="mr-3 text-xs font-medium text-turquesa hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCategoria(categoria.id_categoria)}
                    disabled={eliminando === categoria.id_categoria}
                    className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                  >
                    {eliminando === categoria.id_categoria ? "..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}

            {categorias.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-humo/60">
                  No hay categorías registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalCategoria
          modo={modalAbierto}
          categoriaInicial={categoriaEditando}
          onClose={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}