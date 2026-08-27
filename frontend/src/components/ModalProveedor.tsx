"use client";

import { useState } from "react";
import type { Proveedor } from "@/types/proveedor";

type Props = {
  modo: "crear" | "editar";
  proveedorInicial?: Proveedor;
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalProveedor({
  modo,
  proveedorInicial,
  onClose,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState(proveedorInicial?.nombre ?? "");
  const [telefono, setTelefono] = useState(proveedorInicial?.telefono ?? "");
  const [direccion, setDireccion] = useState(proveedorInicial?.direccion ?? "");
  const [correo, setCorreo] = useState(proveedorInicial?.correo ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const payload = {
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      correo: correo || null,
    };

    const url =
      modo === "crear"
        ? "/api/proveedores"
        : `/api/proveedores/${proveedorInicial?.id_proveedor}`;
    const method = modo === "crear" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      onGuardado();
    } catch {
      setError("No se pudo guardar el proveedor. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-hueso">
          {modo === "crear" ? "Nuevo proveedor" : "Editar proveedor"}
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
            <label className="mb-1 block text-xs text-humo">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Dirección</label>
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
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