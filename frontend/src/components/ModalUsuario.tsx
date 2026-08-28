"use client";

import { useState } from "react";
import type { Usuario } from "@/types/usuario";


const ROLES = ["Administrador", "Vendedor", "Inventario"];

type Props = {
  modo: "crear" | "editar";
  usuarioInicial?: Usuario;
  onClose: () => void;
  onGuardado: () => void;
};

export default function ModalUsuario({
  modo,
  usuarioInicial,
  onClose,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState(usuarioInicial?.nombre ?? "");
  const [usuario, setUsuario] = useState(usuarioInicial?.usuario ?? "");
  const [correo, setCorreo] = useState(usuarioInicial?.correo ?? "");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState(usuarioInicial?.rol ?? ROLES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    // El payload es distinto según el modo, porque el backend acepta campos distintos
    const payload =
      modo === "crear"
        ? { nombre, usuario, correo: correo || null, clave, rol }
        : { nombre, correo: correo || null, rol };

    const url =
      modo === "crear"
        ? "/api/usuarios"
        : `/api/usuarios/${usuarioInicial?.id_usuario}`;
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
      setError("No se pudo guardar el usuario. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-carbon-soft p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-hueso">
          {modo === "crear" ? "Nuevo usuario" : "Editar usuario"}
        </h2>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-humo">Nombre completo</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          {/* El nombre de usuario y la clave solo se piden al crear.
              El backend no permite cambiarlos desde este formulario. */}
          {modo === "crear" && (
            <>
              <div>
                <label className="mb-1 block text-xs text-humo">Nombre de usuario</label>
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-humo">Contraseña</label>
                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs text-humo">Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-humo">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 text-sm text-hueso outline-none focus:border-turquesa"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
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