"use client";

import { useState } from "react";
import type { Categoria } from "@/types/categoria";

type Props = {
  modo: "crear" | "editar";
  categoriaInicial?: Categoria;
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalCategoria({
  modo,
  categoriaInicial,
  onClose,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(categoriaInicial?.descripcion ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const payload = { nombre, descripcion };
    const url =
      modo === "crear"
        ? "/api/categorias"
        : `/api/categorias/${categoriaInicial?.id_categoria}`;
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
      setError("No se pudo guardar la categoría. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-hueso">
          {modo === "crear" ? "Nueva categoría" : "Editar categoría"}
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
              rows={3}
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