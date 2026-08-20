"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { PERMISOS } from "@/modules/auth/constants/roles";
import { CONFIG } from "@/shared/constants/config";
import { NAV_PANEL } from "@/shared/constants/navegacion";
import { RUTAS } from "@/shared/constants/rutas";
import { cn } from "@/shared/lib/cn";

/**
 * Sidebar del panel: 250px, fondo #111, sin sombras.
 *
 * Bajo 900px pasa a superpuesto y se cierra con la hamburguesa. Dos mejoras
 * sobre el guía: se cierra al cambiar de ruta y con Escape (allí quedaba
 * abierto tapando el contenido tras navegar).
 */
export function SidebarAdmin({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const ruta = usePathname();
  const { usuario, cerrarSesion } = useSesion();

  // Se filtran los ítems por el permiso `ver` del módulo, derivado de las rutas
  // del backend: así nadie ve una sección que le va a responder 403.
  const items = NAV_PANEL.filter(
    (item) => usuario && (PERMISOS[item.permiso].ver as readonly string[]).includes(usuario.rol)
  );

  return (
    <>
      {/* Fondo oscuro solo en móvil, para cerrar tocando fuera. */}
      {abierto && (
        <button
          type="button"
          onClick={onCerrar}
          className="fixed inset-0 z-90 bg-black/60 panel:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          "flex w-sidebar min-w-sidebar flex-col border-r border-borde-suave bg-fondo-lateral transition-[margin] duration-300",
          "fixed inset-y-0 left-0 z-100 h-dvh panel:static panel:h-auto",
          abierto ? "ml-0" : "-ml-sidebar panel:ml-0"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-borde-suave p-5">
          <Image src="/img/logo-smokesoft.png" alt="" width={40} height={40} className="size-10" />
          <span className="text-[1.3rem] font-bold text-acento">{CONFIG.nombreApp}</span>
        </div>

        <nav className="flex flex-1 flex-col py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // Al navegar se cierra: en móvil el sidebar es superpuesto y si
              // no, quedaría tapando la pantalla a la que acabas de entrar.
              onClick={onCerrar}
              className={cn(
                "flex w-full items-center gap-3 px-5 py-3 text-[0.95rem] transition-colors",
                esActivo(ruta, item.href)
                  ? "bg-acento font-semibold text-sobre-acento"
                  : "text-texto-apagado hover:bg-acento-menu hover:text-texto"
              )}
              aria-current={esActivo(ruta, item.href) ? "page" : undefined}
            >
              <span className="w-[22px] text-center text-[1.1rem]" aria-hidden="true">
                {item.icono}
              </span>
              {item.etiqueta}
            </Link>
          ))}

          {/* mt-auto lo empuja al fondo, como en el guía. */}
          <button
            type="button"
            onClick={() => cerrarSesion(RUTAS.ingresar)}
            className="mt-auto flex w-full cursor-pointer items-center gap-3 border-t border-borde-suave px-5 py-3 text-[0.95rem] text-peligro-suave transition-colors hover:bg-peligro-menu hover:text-peligro"
          >
            <span className="w-[22px] text-center text-[1.1rem]" aria-hidden="true">🚪</span>
            Cerrar Sesión
          </button>
        </nav>
      </aside>
    </>
  );
}

/** El dashboard vive en /panel, que es prefijo de todo: solo coincidencia exacta. */
function esActivo(ruta: string | null, href: string): boolean {
  if (!ruta) return false;
  if (href === RUTAS.panel) return ruta === RUTAS.panel;
  return ruta === href || ruta.startsWith(`${href}/`);
}
