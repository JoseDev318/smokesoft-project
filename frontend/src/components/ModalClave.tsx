"use client";

import { useState } from "react";

type Props = {
  idUsuario: number;
  nombreUsuario: string;
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalClave({
  idUsuario,
  nombreUsuario,
  onClose,
  onGuardado,
}: Props) {
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    try {
      const res = await fetch(`/api/usuarios/${idUsuario}/clave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });

      if (!res.ok) throw new Error();

      onGuardado();
    } catch {
      setError("No se pudo cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-1 font-display text-lg font-bold text-hueso">
          Restablecer contraseña
        </h2>
        <p className="mb-4 text-xs text-humo">
          Nueva contraseña para <span className="text-hueso">{nombreUsuario}</span>
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-humo">Nueva contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              minLength={6}
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
              {guardando ? "Guardando..." : "Restablecer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}