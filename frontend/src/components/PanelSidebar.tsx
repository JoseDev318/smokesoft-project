"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { UsuarioToken } from "@/lib/auth";

const SECCIONES = [
  { href: "/panel", label: "Dashboard", icono: "📊" },
  { href: "/panel/productos", label: "Productos", icono: "📦" },
  { href: "/panel/categorias", label: "Categorías", icono: "🏷️" },
  { href: "/panel/proveedores", label: "Proveedores", icono: "🚚" },
  { href: "/panel/compras", label: "Compras", icono: "🧾" },
  { href: "/panel/clientes", label: "Clientes", icono: "👥" },
  { href: "/panel/usuarios", label: "Usuarios", icono: "🔐" },
];

type Props = {
  usuario: UsuarioToken | null;
};

export default function PanelSidebar({ usuario }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const inicial = usuario?.nombre?.charAt(0).toUpperCase() ?? "?";

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-carbon-soft p-4">
      {/* Encabezado con logo + nombre del software */}
      <div className="flex items-center gap-2 px-2 py-3">
        <Image
          src="/img/logo-smokesoft-icon.png"
          alt="SmokeSoft"
          width={28}
          height={28}
        />
        <span className="font-display text-lg font-bold text-turquesa">
          SmokeSoft
        </span>
      </div>

      <div className="mb-2 border-t border-white/10" />

      {/* Navegación */}
      <nav className="flex flex-col gap-1">
        {SECCIONES.map((seccion, index) => {
          const activo = pathname === seccion.href;

          return (
            <div key={seccion.href}>
              <Link
                href={seccion.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-turquesa text-carbon"
                    : "text-humo hover:bg-white/5 hover:text-hueso"
                }`}
              >
                <span>{seccion.icono}</span>
                {seccion.label}
              </Link>

              {index < SECCIONES.length - 1 && (
                <div className="my-1 border-t border-white/5" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Empuja el bloque de usuario hasta el fondo del sidebar */}
      <div className="mt-auto">
        <div className="my-2 border-t border-white/10" />

        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquesa text-sm font-semibold text-carbon">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-hueso">
              {usuario?.nombre ?? "Invitado"}
            </p>
            <p className="truncate text-xs text-humo/60">{usuario?.rol ?? "-"}</p>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}