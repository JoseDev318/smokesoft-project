"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const respuesta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, clave }),
    });

    setCargando(false);

    if (!respuesta.ok) {
      const datos = await respuesta.json();
      setError(datos.error ?? "No se pudo iniciar sesión");
      return;
    }

    router.push("/panel");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6">
      <form
        onSubmit={manejarEnvio}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-carbon-soft p-8"
      >
        <h1 className="font-display text-2xl font-bold text-hueso">
          Ingresar
        </h1>
        <p className="mt-1 text-sm text-humo">
          Accede al panel de administración
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="usuario" className="text-sm text-humo">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-carbon px-4 py-2 text-hueso outline-none focus:border-turquesa"
            />
          </div>

          <div>
            <label htmlFor="clave" className="text-sm text-humo">
              Contraseña
            </label>
            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-carbon px-4 py-2 text-hueso outline-none focus:border-turquesa"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="mt-6 w-full rounded-full bg-turquesa py-2.5 font-semibold text-carbon transition-colors hover:bg-turquesa-dim disabled:opacity-60"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-humo hover:text-hueso"
        >
          Volver al inicio
        </Link>
      </form>
    </main>
  );
}