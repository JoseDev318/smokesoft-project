"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { ventasService } from "@/modules/ventas/services/ventas.service";
import { mensajeDeError } from "@/shared/api/errores";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { EstadoVacio, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { formatearMoneda } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";
import { BarraServicios } from "../components/BarraServicios";

/**
 * Panel del cliente. La vista `perfil.html` del guía referenciaba clases
 * (.welcome-banner, .card, .btn-dashboard, .crud-section) que NO existían en
 * ninguna de sus hojas de estilo: se renderizaba sin formato. Aquí se reconstruye
 * con los tokens del sistema, respetando la intención del diseño.
 */
export function VistaPerfil() {
  const { usuario } = useSesion();

  const pedidos = useQuery({ queryKey: ["ventas", "mias"], queryFn: ventasService.mias });
  const ultimos = (pedidos.data ?? []).slice(0, 5);

  return (
    <div>
      <BarraServicios />

      <div className="mx-auto w-[90%] max-w-[1100px] px-5 py-8">
        {/* Banner de bienvenida: el borde izquierdo cian es el motivo del guía
            para paneles informativos. */}
        <div className="mb-6 rounded-tarjeta border-l-4 border-l-acento bg-superficie p-6">
          <h1 className="mb-1.5 text-[1.5rem] font-bold text-acento">
            👋 Hola, {primerNombre(usuario?.nombre)}
          </h1>
          <p className="text-texto-secundario">
            Bienvenido a tu panel. Gestiona tus pedidos y tus datos personales.
          </p>
        </div>

        <div className="mb-8 grid gap-5 movil:grid-cols-2 panel:grid-cols-3">
          <TarjetaAcceso
            icono="📦"
            titulo="Mis Pedidos"
            descripcion="Revisa el estado de tus compras y el historial completo."
            href={RUTAS.misPedidos}
            textoEnlace="Ver pedidos"
          />
          <TarjetaAcceso
            icono="👤"
            titulo="Datos Personales"
            descripcion="Actualiza tu dirección, teléfono y correo electrónico."
            href={RUTAS.misDatos}
            textoEnlace="Editar perfil"
          />
          <TarjetaAcceso
            icono="🛍️"
            titulo="Seguir comprando"
            descripcion="Explora el catálogo y descubre los productos disponibles."
            href={RUTAS.productos}
            textoEnlace="Ir a la tienda"
          />
        </div>

        <Tarjeta>
          <CabeceraTarjeta titulo="Últimas compras">
            <Link
              href={RUTAS.misPedidos}
              className="text-[0.85rem] font-semibold text-acento hover:underline"
            >
              Ver todas
            </Link>
          </CabeceraTarjeta>

          {pedidos.error ? (
            <MensajeError
              mensaje={mensajeDeError(pedidos.error)}
              onReintentar={() => void pedidos.refetch()}
            />
          ) : ultimos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no has hecho pedidos"
              mensaje="Cuando compres algo, aparecerá aquí."
            >
              <Link href={RUTAS.productos} className="btn btn-acento">Ver productos</Link>
            </EstadoVacio>
          ) : (
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>Pedido</th><th>Fecha</th>
                    <th className="text-right">Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimos.map((pedido) => (
                    <tr key={pedido.id_venta}>
                      <td>#{String(pedido.id_venta).padStart(3, "0")}</td>
                      <td>{formatearFecha(pedido.fecha)}</td>
                      <td className="celda-numerica font-semibold">
                        {formatearMoneda(pedido.total)}
                      </td>
                      <td className="celda-acciones">
                        <Link
                          href={RUTAS.miPedido(pedido.id_venta)}
                          className="btn-accion btn-accion-ver"
                          aria-label={`Ver el pedido ${pedido.id_venta}`}
                          title="Ver detalle"
                        >
                          👁
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}

function TarjetaAcceso({
  icono, titulo, descripcion, href, textoEnlace,
}: {
  icono: string; titulo: string; descripcion: string; href: string; textoEnlace: string;
}) {
  return (
    <Tarjeta className="flex flex-col">
      <h2 className="mb-2 text-[1.1rem] font-semibold text-acento">
        <span aria-hidden="true">{icono}</span> {titulo}
      </h2>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-texto-apagado">{descripcion}</p>
      <Link href={href} className="btn btn-fantasma self-start">
        {textoEnlace}
      </Link>
    </Tarjeta>
  );
}

function primerNombre(nombre: string | undefined): string {
  if (!nombre) return "de nuevo";
  return nombre.trim().split(/\s+/)[0];
}
