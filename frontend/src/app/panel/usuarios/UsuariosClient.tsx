"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalUsuario from "@/components/ModalUsuario";
import ModalClave from "@/components/ModalClave";
import type { Usuario } from "@/types/usuario";

type Props = {
  usuarios: Usuario[];
};

export default function UsuariosClient({ usuarios }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | undefined>();
  const [procesando, setProcesando] = useState<number | null>(null);
  const [usuarioParaClave, setUsuarioParaClave] = useState<Usuario | null>(null);

  function abrirCrear() {
    setUsuarioEditando(undefined);
    setModalAbierto("crear");
  }

  function abrirEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    setModalAbierto("editar");
  }
  function abrirCambioClave(usuario: Usuario) {
  setUsuarioParaClave(usuario);
  }

  function cerrarModalClave() {
  setUsuarioParaClave(null);
  }

  function alGuardarClave() {
  cerrarModalClave();
  // No hace falta router.refresh() aquí — la clave no se muestra en la tabla
  }

  function cerrarModal() {
    setModalAbierto(null);
  }

  function alGuardar() {
    cerrarModal();
    router.refresh();
  }

  async function alternarEstado(usuario: Usuario) {
    setProcesando(usuario.id_usuario);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id_usuario}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !usuario.estado }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo cambiar el estado del usuario.");
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarUsuario(id: number) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;

    setProcesando(id);
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-hueso">Usuarios</h1>
          <p className="text-sm text-humo">Cuentas con acceso al sistema.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="rounded-lg bg-turquesa px-4 py-2 text-sm font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-soft text-xs uppercase tracking-wider text-humo/70">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-hueso">{u.nombre}</td>
                <td className="px-4 py-3 text-humo">{u.usuario}</td>
                <td className="px-4 py-3 text-humo">{u.correo || "-"}</td>
                <td className="px-4 py-3 text-humo">{u.rol}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => alternarEstado(u)}
                    disabled={procesando === u.id_usuario}
                    className={`rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      u.estado
                        ? "bg-turquesa/10 text-turquesa hover:bg-turquesa/20"
                        : "bg-white/5 text-humo/60 hover:bg-white/10"
                    }`}
                  >
                    {u.estado ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirEditar(u)}
                    className="mr-3 text-xs font-medium text-turquesa hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => abrirCambioClave(u)}
                    className="mr-3 text-xs font-medium text-humo hover:text-hueso hover:underline"
                  >
                    Contraseña
                  </button>
                  <button
                    onClick={() => eliminarUsuario(u.id_usuario)}
                    disabled={procesando === u.id_usuario}
                    className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-humo/60">
                  No hay usuarios registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalUsuario
          modo={modalAbierto}
          usuarioInicial={usuarioEditando}
          onClose={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
      {usuarioParaClave && (
        <ModalClave
          idUsuario={usuarioParaClave.id_usuario}
          nombreUsuario={usuarioParaClave.nombre}
          onClose={cerrarModalClave}
          onGuardado={alGuardarClave}
        />
      )}
    </div>
  );
}