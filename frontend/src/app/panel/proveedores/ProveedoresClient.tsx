"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalProveedor from "@/components/ModalProveedor";
import type { Proveedor } from "@/types/proveedor";

type Props = {
  proveedores: Proveedor[];
};

export default function ProveedoresClient({ proveedores }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | undefined>();
  const [eliminando, setEliminando] = useState<number | null>(null);

  function abrirCrear() {
    setProveedorEditando(undefined);
    setModalAbierto("crear");
  }

  function abrirEditar(proveedor: Proveedor) {
    setProveedorEditando(proveedor);
    setModalAbierto("editar");
  }

  function cerrarModal() {
    setModalAbierto(null);
  }

  function alGuardar() {
    cerrarModal();
    router.refresh();
  }

  async function eliminarProveedor(id: number) {
    if (!confirm("¿Eliminar este proveedor? Esta acción no se puede deshacer.")) return;

    setEliminando(id);
    try {
      const res = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo eliminar el proveedor. Revisa si tiene productos asociados.");
    } finally {
      setEliminando(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-hueso">Proveedores</h1>
          <p className="text-sm text-humo">Directorio de suplidores de SmokeSoft.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nuevo proveedor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {proveedores.map((p) => (
              <tr key={p.id_proveedor} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-hueso">{p.nombre}</td>
                <td className="px-4 py-3 text-humo">{p.telefono || "-"}</td>
                <td className="px-4 py-3 text-humo">{p.direccion || "-"}</td>
                <td className="px-4 py-3 text-humo">{p.correo || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="mr-3 text-xs font-medium text-turquesa hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarProveedor(p.id_proveedor)}
                    disabled={eliminando === p.id_proveedor}
                    className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                  >
                    {eliminando === p.id_proveedor ? "..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}

            {proveedores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-humo/60">
                  No hay proveedores registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalProveedor
          modo={modalAbierto}
          proveedorInicial={proveedorEditando}
          onClose={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}