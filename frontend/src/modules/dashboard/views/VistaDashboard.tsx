"use client";

import Link from "next/link";

import { mensajeDeError } from "@/shared/api/errores";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { TejaDato } from "@/shared/components/ui/TejaDato";
import { Cargando, Insignia, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { formatearMoneda, formatearNumero } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";
import { useMetricasDashboard } from "../hooks/useMetricasDashboard";

/**
 * Dashboard. Réplica del de admin.js: la fila de tejas más los paneles
 * "Ventas Recientes" y "Productos por Cliente", con un panel nuevo de stock
 * bajo (el backend ya tenía el endpoint y el guía no lo usaba).
 *
 * Cada teja y cada panel solo se pinta si el rol tiene permiso de verlo.
 */
export function VistaDashboard() {
  const m = useMetricasDashboard();

  return (
    <div>
      <h1 className="mb-5 text-[1.5rem] font-semibold text-texto">Dashboard</h1>

      {m.error && (
        <div className="mb-5">
          <MensajeError mensaje={mensajeDeError(m.error)} />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        {m.puede.inventario && (
          <>
            <TejaDato etiqueta="Productos" valor={formatearNumero(m.resumen?.total)} />
            <TejaDato etiqueta="Existencias" valor={formatearNumero(m.resumen?.existencias)} />
            <TejaDato etiqueta="Stock bajo" valor={formatearNumero(m.resumen?.stock_bajo)} />
          </>
        )}
        {m.puede.clientes && (
          <TejaDato etiqueta="Clientes" valor={formatearNumero(m.totalClientes)} />
        )}
        {m.puede.ventas && (
          <>
            <TejaDato etiqueta="Ventas" valor={formatearNumero(m.estadisticas?.total_ventas)} />
            <TejaDato
              etiqueta="Ingresos"
              valor={formatearMoneda(m.estadisticas?.ingresos)}
              esMoneda
            />
          </>
        )}
        {m.puede.proveedores && (
          <TejaDato etiqueta="Proveedores" valor={formatearNumero(m.totalProveedores)} />
        )}
        {m.puede.usuarios && (
          <TejaDato etiqueta="Usuarios" valor={formatearNumero(m.totalUsuarios)} />
        )}
      </div>

      {m.cargando && <Cargando />}

      <div className="grid gap-5 panel:grid-cols-2">
        {m.puede.ventas && (
          <Tarjeta>
            <CabeceraTarjeta titulo="Ventas Recientes">
              <Link
                href={RUTAS.panelVentas}
                className="text-[0.85rem] font-semibold text-acento hover:underline"
              >
                Ver todas
              </Link>
            </CabeceraTarjeta>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {m.recientes.length === 0 ? (
                    <tr><td colSpan={4} className="celda-vacia">Sin ventas registradas</td></tr>
                  ) : (
                    m.recientes.map((venta) => (
                      <tr key={venta.id_venta}>
                        <td>#{String(venta.id_venta).padStart(3, "0")}</td>
                        <td>{venta.cliente_nombre ?? "—"}</td>
                        <td>{formatearFecha(venta.fecha)}</td>
                        <td className="celda-numerica">{formatearMoneda(venta.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        )}

        {m.puede.ventas && (
          <Tarjeta>
            <CabeceraTarjeta titulo="Productos por Cliente" />
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr><th>Cliente</th><th>Ventas</th><th>Total</th><th>Productos</th></tr>
                </thead>
                <tbody>
                  {m.porCliente.length === 0 ? (
                    <tr><td colSpan={4} className="celda-vacia">Aún no hay ventas por cliente</td></tr>
                  ) : (
                    m.porCliente.map((fila) => (
                      <tr key={fila.id_cliente}>
                        <td>{fila.cliente_nombre}</td>
                        <td>{fila.total_ventas}</td>
                        <td className="celda-numerica">{formatearMoneda(fila.total_gastado)}</td>
                        <td className="max-w-[280px] text-[0.85rem] text-texto-apagado">
                          {fila.productos ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        )}

        {m.puede.inventario && (
          <Tarjeta className="panel:col-span-2">
            <CabeceraTarjeta titulo="Productos con stock bajo">
              <Link
                href={RUTAS.panelInventario}
                className="text-[0.85rem] font-semibold text-acento hover:underline"
              >
                Gestionar inventario
              </Link>
            </CabeceraTarjeta>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {m.stockBajo.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="celda-vacia">
                        Todo el inventario está por encima del mínimo
                      </td>
                    </tr>
                  ) : (
                    m.stockBajo.map((producto) => (
                      <tr key={producto.id_producto}>
                        <td>{producto.nombre}</td>
                        <td>{producto.stock}</td>
                        <td>{producto.stock_minimo}</td>
                        <td>
                          {producto.stock <= 0 ? (
                            <Insignia tono="peligro">Agotado</Insignia>
                          ) : (
                            <Insignia tono="alerta">Stock bajo</Insignia>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
