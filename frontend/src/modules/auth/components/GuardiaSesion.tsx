"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { sesionValida, limpiar } from "@/shared/api/sesionStore";
import { Cargando } from "@/shared/components/ui/estados";
import { rutaIngresar } from "@/shared/constants/rutas";
import type { Rol } from "@/shared/types/bd.types";
import { useSesion } from "../context/ProveedorSesion";

/**
 * Protección real del lado del cliente. Se monta en los layouts de las
 * secciones privadas.
 *
 * El middleware ya filtró por cookie, así que en el caso normal esto no
 * dispara nada — que es justo el punto: no hay parpadeo cuando todo va bien, y
 * el comportamiento sigue siendo correcto cuando no.
 */
export function GuardiaSesion({
  rolesPermitidos,
  children,
}: {
  rolesPermitidos: Rol[];
  children: React.ReactNode;
}) {
  const { usuario, cargando } = useSesion();
  const router = useRouter();
  const ruta = usePathname();

  const sinSesion = !cargando && (!usuario || !sesionValida());

  useEffect(() => {
    if (!sinSesion) return;
    limpiar();
    router.replace(rutaIngresar(ruta ?? undefined, "expirada"));
  }, [sinSesion, router, ruta]);

  if (cargando) return <Cargando pantallaCompleta />;
  if (sinSesion) return <Cargando pantallaCompleta texto="Redirigiendo…" />;

  // Rol insuficiente: se muestra un aviso en lugar de redirigir. Un bucle de
  // redirección aquí es muy difícil de depurar, y el usuario merece saber qué
  // pasó en vez de rebotar sin explicación.
  if (usuario && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
        <p className="mb-3 text-[3rem]" aria-hidden="true">🔒</p>
        <h1 className="mb-2 text-xl font-semibold text-texto">No tienes acceso a esta sección</h1>
        <p className="max-w-md text-sm text-texto-secundario">
          Tu rol ({usuario.rol}) no permite ver este contenido. Si crees que es un
          error, pide a un administrador que revise tus permisos.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Muestra su contenido solo si el rol actual está en la lista. */
export function SiRol({
  roles,
  children,
  alternativa = null,
}: {
  roles: Rol[];
  children: React.ReactNode;
  alternativa?: React.ReactNode;
}) {
  const { usuario } = useSesion();
  if (!usuario || !roles.includes(usuario.rol)) return <>{alternativa}</>;
  return <>{children}</>;
}
