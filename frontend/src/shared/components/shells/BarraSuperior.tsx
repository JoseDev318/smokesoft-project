"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useSesion, inicioSegunRol } from "@/modules/auth/context/ProveedorSesion";
import { IconoCarrito } from "@/modules/carrito/components/IconoCarrito";
import { CONFIG } from "@/shared/constants/config";
import { NAV_PUBLICA } from "@/shared/constants/navegacion";
import { RUTAS } from "@/shared/constants/rutas";
import { cn } from "@/shared/lib/cn";

/**
 * Barra superior traslúcida del shell público (rgba(0,0,0,.7) sobre el fondo
 * de humo). El guía tenía dos clases duplicadas para esto (.encabezado y
 * .header, "para compatibilidad"); aquí es un solo componente.
 */
export function BarraSuperior() {
  const ruta = usePathname();
  const { usuario, autenticado, cerrarSesion } = useSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="bg-velo-barra">
      <div className="flex items-center justify-between px-5 py-3 panel:px-10 panel:py-4">
        <Link href={RUTAS.inicio} className="flex items-center gap-2.5">
          <Image
            src="/img/logo-smokesoft.png"
            alt=""
            width={65}
            height={65}
            className="size-11 panel:size-[65px]"
            priority
          />
          <span className="text-xl font-bold text-texto panel:text-[1.8rem]">
            {CONFIG.nombreApp}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center panel:flex">
            {NAV_PUBLICA.map((item) => (
              <EnlaceNav key={item.href} href={item.href} activo={esActivo(ruta, item.href)}>
                {item.etiqueta}
              </EnlaceNav>
            ))}
            {autenticado ? (
              <>
                <EnlaceNav
                  href={usuario ? inicioSegunRol(usuario.rol) : RUTAS.perfil}
                  activo={esActivo(ruta, RUTAS.perfil)}
                >
                  {usuario?.rol === "Cliente" ? "Mi Perfil" : "Mi Panel"}
                </EnlaceNav>
                <button
                  type="button"
                  onClick={() => cerrarSesion(RUTAS.inicio)}
                  className="ml-6 cursor-pointer text-[0.95rem] font-medium text-texto transition-colors hover:text-acento"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <EnlaceNav href={RUTAS.ingresar} activo={esActivo(ruta, RUTAS.ingresar)}>
                Ingresar
              </EnlaceNav>
            )}
          </nav>

          <IconoCarrito />

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="cursor-pointer rounded p-1 text-2xl text-texto panel:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Menú desplegado en móvil. El guía no tenía navegación móvil: los
          enlaces simplemente se salían de la pantalla. */}
      {menuAbierto && (
        <nav className="flex flex-col border-t border-white/10 px-5 pb-4 panel:hidden">
          {NAV_PUBLICA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuAbierto(false)}
              className={cn(
                "py-2.5 text-[0.95rem] font-medium transition-colors",
                esActivo(ruta, item.href) ? "text-acento" : "text-texto hover:text-acento"
              )}
            >
              {item.etiqueta}
            </Link>
          ))}
          {autenticado ? (
            <button
              type="button"
              onClick={() => { setMenuAbierto(false); cerrarSesion(RUTAS.inicio); }}
              className="cursor-pointer py-2.5 text-left text-[0.95rem] font-medium text-peligro-suave"
            >
              Cerrar Sesión
            </button>
          ) : (
            <Link
              href={RUTAS.ingresar}
              onClick={() => setMenuAbierto(false)}
              className="py-2.5 text-[0.95rem] font-medium text-texto hover:text-acento"
            >
              Ingresar
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

function EnlaceNav({
  href, activo, children,
}: {
  href: string; activo: boolean; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "ml-6 text-[0.95rem] font-medium transition-colors",
        activo ? "text-acento" : "text-texto hover:text-acento"
      )}
      aria-current={activo ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

/** La raíz solo marca activo en coincidencia exacta; el resto por prefijo. */
function esActivo(ruta: string | null, href: string): boolean {
  if (!ruta) return false;
  if (href === "/") return ruta === "/";
  return ruta === href || ruta.startsWith(`${href}/`);
}
