"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import {
  guardar, limpiar, obtenerSnapshotServidor, obtenerSnapshotSesion,
  sesionValida, suscribirSesion, type SesionUsuario,
} from "@/shared/api/sesionStore";
import { RUTAS } from "@/shared/constants/rutas";
import { useHidratado } from "@/shared/hooks/useHidratado";
import { ROLES_STAFF, type Rol } from "@/shared/types/bd.types";
import type { LoginDto, RegistroClienteDto } from "@/shared/types/dto.types";
import { authService } from "../services/auth.service";

interface ValorSesion {
  usuario: SesionUsuario | null;
  /** true durante el render del servidor y la hidratación. */
  cargando: boolean;
  autenticado: boolean;
  esStaff: boolean;
  esCliente: boolean;
  tiene: (...roles: Rol[]) => boolean;
  ingresar: (dto: LoginDto) => Promise<SesionUsuario>;
  registrar: (dto: RegistroClienteDto) => Promise<SesionUsuario>;
  cerrarSesion: (destino?: string) => void;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

/** A dónde va cada rol después de entrar. */
export function inicioSegunRol(rol: Rol): string {
  return rol === "Cliente" ? RUTAS.perfil : RUTAS.panel;
}

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  /**
   * La sesión se LEE del almacén externo (las cookies), no se copia a estado.
   *
   * Así se resuelven tres cosas de una vez:
   *  - No hay setState dentro de un efecto (que causa renders en cascada).
   *  - El wrapper de fetch puede limpiar la sesión al detectar un 401/403 y el
   *    árbol entero se enteral, porque `limpiar()` notifica al almacén.
   *  - Un cierre de sesión en otra pestaña se refleja aquí, vía el evento
   *    `storage`.
   */
  const usuario = useSyncExternalStore(
    suscribirSesion,
    obtenerSnapshotSesion,
    obtenerSnapshotServidor
  );

  const hidratado = useHidratado();

  const cerrarSesion = useCallback((destino?: string) => {
    limpiar();
    router.replace(destino ?? RUTAS.ingresar);
  }, [router]);

  const ingresar = useCallback(async (dto: LoginDto) => {
    const { token, usuario: datos } = await authService.ingresar(dto);
    guardar(token, datos);
    return datos;
  }, []);

  const registrar = useCallback(async (dto: RegistroClienteDto) => {
    const { token, usuario: datos } = await authService.registrar(dto);
    guardar(token, datos);
    return datos;
  }, []);

  const valor = useMemo<ValorSesion>(() => {
    // Antes de hidratar no se sabe nada: hacer como si no hubiera sesión
    // evitaría el parpadeo pero rompería la hidratación, así que se expone
    // `cargando` y quien lo necesite espera.
    const activo = hidratado && usuario !== null && sesionValida() ? usuario : null;

    return {
      usuario: activo,
      cargando: !hidratado,
      autenticado: activo !== null,
      esStaff: activo !== null && ROLES_STAFF.includes(activo.rol),
      esCliente: activo?.rol === "Cliente",
      tiene: (...roles: Rol[]) => activo !== null && roles.includes(activo.rol),
      ingresar,
      registrar,
      cerrarSesion,
    };
  }, [usuario, hidratado, ingresar, registrar, cerrarSesion]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): ValorSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de <ProveedorSesion>");
  }
  return contexto;
}
