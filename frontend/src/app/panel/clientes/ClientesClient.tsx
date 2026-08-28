"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalCliente from "@/components/ModalCliente";
import type { Cliente } from "@/types/cliente";

type Props = {
  clientes: Cliente[];
};

export default function ClientesClient({ clientes }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [clienteEditando, setClienteEditando] = useState<Cliente | undefined>();
  const [eliminando, setEliminando] = useState<number | null>(null);

  function abrirCrear() {
    setClienteEditando(undefined);
    setModalAbierto("crear");
  }

  function abrirEditar(cliente: Cliente) {
    setClienteEditando(cliente);
    setModalAbierto("editar");
  }

  function cerrarModal() {
    setModalAbierto(null);
  }

  function alGuardar() {
    cerrarModal();
    router.refresh();
  }

  async function eliminarCliente(id: number) {
    if (!confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;

    setEliminando(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
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
          <h1 className="font-display text-2xl font-bold text-hueso">Clientes</h1>
          <p className="text-sm text-humo">Directorio de clientes de SmokeSoft.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clientes.map((cliente) => (
              <tr key={cliente.id_cliente} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-hueso">{cliente.nombre}</td>
                <td className="px-4 py-3 text-humo">{cliente.correo || "-"}</td>
                <td className="px-4 py-3 text-humo">{cliente.telefono || "-"}</td>
                <td className="px-4 py-3 text-humo">{cliente.direccion || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirEditar(cliente)}
                    className="mr-3 text-xs font-medium text-turquesa hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCliente(cliente.id_cliente)}
                    disabled={eliminando === cliente.id_cliente}
                    className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                  >
                    {eliminando === cliente.id_cliente ? "..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}

            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-humo/60">
                  No hay clientes registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalCliente
          modo={modalAbierto}
          clienteInicial={clienteEditando}
          onClose={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}