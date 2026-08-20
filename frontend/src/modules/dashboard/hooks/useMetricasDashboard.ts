"use client";

import { useQueries } from "@tanstack/react-query";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { PERMISOS } from "@/modules/auth/constants/roles";
import { clientesService } from "@/modules/clientes/services/clientes.service";
import { productosService } from "@/modules/productos/services/productos.service";
import { proveedoresService } from "@/modules/proveedores/services/proveedores.service";
import { usuariosService } from "@/modules/usuarios/services/usuarios.service";
import { ventasService } from "@/modules/ventas/services/ventas.service";

/**
 * Métricas del dashboard.
 *
 * Cada consulta se habilita según el permiso del rol: un Vendedor no puede
 * llamar a /usuarios (Administrador únicamente) ni a /productos/resumen
 * (Administrador e Inventario). Sin `enabled`, cada carga del panel dispararía
 * varios 403 inútiles.
 */
export function useMetricasDashboard() {
  const { usuario } = useSesion();
  const rol = usuario?.rol;

  const permitido = (modulo: keyof typeof PERMISOS) =>
    !!rol && (PERMISOS[modulo].ver as readonly string[]).includes(rol);

  const consultas = useQueries({
    queries: [
      {
        queryKey: ["productos", "resumen"],
        queryFn: productosService.resumen,
        enabled: permitido("inventario"),
      },
      {
        queryKey: ["productos", "stock-bajo"],
        queryFn: productosService.stockBajo,
        enabled: permitido("inventario"),
      },
      {
        queryKey: ["ventas", "estadisticas"],
        queryFn: ventasService.estadisticas,
        enabled: permitido("ventas"),
      },
      {
        queryKey: ["ventas", "recientes"],
        queryFn: () => ventasService.recientes(5),
        enabled: permitido("ventas"),
      },
      {
        queryKey: ["ventas", "por-cliente"],
        queryFn: ventasService.porCliente,
        enabled: permitido("ventas"),
      },
      {
        queryKey: ["clientes"],
        queryFn: clientesService.listar,
        enabled: permitido("clientes"),
      },
      {
        queryKey: ["proveedores"],
        queryFn: proveedoresService.listar,
        enabled: permitido("proveedores"),
      },
      {
        queryKey: ["usuarios"],
        queryFn: usuariosService.listar,
        enabled: permitido("usuarios"),
      },
    ],
  });

  const [
    resumen, stockBajo, estadisticas, recientes, porCliente, clientes, proveedores, usuarios,
  ] = consultas;

  return {
    resumen: resumen.data,
    stockBajo: stockBajo.data ?? [],
    estadisticas: estadisticas.data,
    recientes: recientes.data ?? [],
    porCliente: porCliente.data ?? [],
    totalClientes: clientes.data?.length,
    totalProveedores: proveedores.data?.length,
    totalUsuarios: usuarios.data?.length,
    cargando: consultas.some((consulta) => consulta.isLoading && consulta.fetchStatus !== "idle"),
    // El primer error real; los módulos sin permiso no consultan, así que no
    // ensucian esto.
    error: consultas.find((consulta) => consulta.error)?.error ?? null,
    puede: {
      inventario: permitido("inventario"),
      ventas: permitido("ventas"),
      clientes: permitido("clientes"),
      proveedores: permitido("proveedores"),
      usuarios: permitido("usuarios"),
    },
  };
}
