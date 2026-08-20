"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientesService } from "@/modules/clientes/services/clientes.service";
import { productosService } from "@/modules/productos/services/productos.service";
import { mensajeDeError } from "@/shared/api/errores";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { TablaLineas } from "@/shared/components/lineas/TablaLineas";
import { lineaVacia, type LineaEditable } from "@/shared/components/lineas/lineas.types";
import { Boton } from "@/shared/components/ui/Boton";
import { AreaTexto, Selector } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { RUTAS } from "@/shared/constants/rutas";
import { calcularTotales } from "@/shared/lib/dinero";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import { ventasService } from "../services/ventas.service";

/**
 * Registro de venta. Es el formulario de "Compras" del guía, con el nombre
 * correcto: descuenta stock y lleva IVA.
 *
 * Los totales que se muestran aquí son una previsualización; el backend los
 * recalcula desde los precios de la base de datos y esos son los que se
 * guardan. Así un precio manipulado en el navegador no altera la factura.
 */
export function VistaVentaNueva() {
  const router = useRouter();
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();

  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaEditable[]>([lineaVacia()]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: clientesService.listar,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: () => productosService.listar(),
  });

  // Solo se pueden vender productos activos y con existencias.
  const vendibles = useMemo(
    () => productos.filter((producto) => producto.activo && producto.stock > 0),
    [productos]
  );

  const totales = useMemo(
    () =>
      calcularTotales(
        lineas
          .filter((linea) => linea.id_producto !== "")
          .map((linea) => ({
            cantidad: linea.cantidad,
            precioUnitario: linea.precio_unitario,
          }))
      ),
    [lineas]
  );

  const mutacion = useMutation({
    mutationFn: () =>
      ventasService.crear({
        id_cliente: idCliente as number,
        notas: notas.trim() || null,
        // Sin precios: el backend los lee de la base de datos.
        items: lineas
          .filter((linea) => linea.id_producto !== "")
          .map((linea) => ({
            id_producto: linea.id_producto as number,
            cantidad: linea.cantidad,
          })),
      }),
    onSuccess: (venta) => {
      avisos.exito(`Venta #${String(venta.id_venta).padStart(3, "0")} registrada`);
      // El stock cambió: hay que invalidar productos, el catálogo y las
      // métricas del dashboard.
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["ventas"] });
      router.replace(RUTAS.panelVenta(venta.id_venta));
    },
    onError: (error) => setErrorGeneral(mensajeDeError(error)),
  });

  function validar(): string | null {
    if (!idCliente) return "Selecciona un cliente";

    const conProducto = lineas.filter((linea) => linea.id_producto !== "");
    if (!conProducto.length) return "Agrega al menos un producto";

    // Comprobación previa de stock: el backend responde 409 y aborta toda la
    // transacción, así que es mejor avisar antes de intentarlo.
    const porId = new Map(productos.map((producto) => [producto.id_producto, producto]));
    // Se acumula por producto: dos líneas del mismo artículo suman, y el
    // backend las consolida igual antes de validar.
    const pedido = new Map<number, number>();
    for (const linea of conProducto) {
      const id = linea.id_producto as number;
      pedido.set(id, (pedido.get(id) ?? 0) + linea.cantidad);
    }

    for (const [id, cantidad] of pedido) {
      const producto = porId.get(id);
      if (!producto) return "Hay una línea con un producto que ya no existe";
      if (cantidad > producto.stock) {
        return `Stock insuficiente para ${producto.nombre} (disponible: ${producto.stock})`;
      }
    }

    return null;
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const problema = validar();
    setErrorGeneral(problema);
    if (!problema) mutacion.mutate();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5rem] font-semibold text-texto">Nueva Venta</h1>
        <Boton variante="neutro" onClick={() => router.push(RUTAS.panelVentas)}>
          Volver al historial
        </Boton>
      </div>

      <form onSubmit={enviar} noValidate className="grid items-start gap-5 panel:grid-cols-[1fr_340px]">
        <Tarjeta>
          <CabeceraTarjeta titulo="Productos de la venta" />

          <Selector
            id="venta-cliente"
            etiqueta="Cliente"
            opciones={clientes.map((cliente) => ({
              valor: cliente.id_cliente,
              etiqueta: cliente.nombre,
            }))}
            placeholder="Seleccionar cliente…"
            value={idCliente ?? ""}
            onChange={(evento) =>
              setIdCliente(evento.target.value ? Number(evento.target.value) : null)
            }
          />

          <TablaLineas
            modo="venta"
            lineas={lineas}
            productos={vendibles}
            onCambiar={setLineas}
            deshabilitado={mutacion.isPending}
          />

          <AreaTexto
            id="venta-notas"
            etiqueta="Notas"
            rows={2}
            placeholder="Observaciones…"
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
          />
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta titulo="Resumen" />

          <ResumenTotales
            subtotal={totales.subtotal}
            iva={totales.iva}
            total={totales.total}
          />

          <p className="mb-4 text-xs text-texto-tenue">
            Los totales definitivos los calcula el servidor con los precios
            vigentes en la base de datos.
          </p>

          {errorGeneral && (
            <p className="mb-4 text-[0.9rem] text-peligro" role="alert">
              {errorGeneral}
            </p>
          )}

          <div className="flex gap-2.5">
            <Boton
              type="button"
              variante="neutro"
              className="flex-1"
              onClick={() => {
                setIdCliente(null);
                setNotas("");
                setLineas([lineaVacia()]);
                setErrorGeneral(null);
              }}
              disabled={mutacion.isPending}
            >
              Limpiar
            </Boton>
            <Boton type="submit" variante="acento" className="flex-1" cargando={mutacion.isPending}>
              Guardar Venta
            </Boton>
          </div>

          <p className="mt-3 text-xs text-texto-tenue">
            Al guardar se descuenta el stock. Si algo falla, no se registra nada.
          </p>
        </Tarjeta>
      </form>
    </div>
  );
}
