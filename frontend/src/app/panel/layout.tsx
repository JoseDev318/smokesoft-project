"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/panel", label: "Dashboard", icono: "📊" },
  { href: "/panel/productos", label: "Productos", icono: "📦" },
  { href: "/panel/categorias", label: "Categorías", icono: "🏷️" },
  { href: "/panel/proveedores", label: "Proveedores", icono: "🚚" },
  { href: "/panel/clientes", label: "Clientes", icono: "👥" },
  { href: "/panel/usuarios", label: "Usuarios", icono: "🔐" },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-carbon-soft p-4 flex flex-col">
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
      </aside>

      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}