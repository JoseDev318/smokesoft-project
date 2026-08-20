"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productosService } from "@/modules/productos/services/productos.service";
import { proveedoresService } from "@/modules/proveedores/services/proveedores.service";
import { mensajeDeError } from "@/shared/api/errores";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { TablaLineas } from "@/shared/components/lineas/TablaLineas";
import { lineaVacia, type LineaEditable } from "@/shared/components/lineas/lineas.types";
import { Boton } from "@/shared/components/ui/Boton";
import { AreaTexto, Selector } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { RUTAS } from "@/shared/constants/rutas";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import { comprasService } from "../services/compras.service";

/**
 * Registro de compra a proveedor: entrada de mercancía, SUMA stock.
 *
 * Vista nueva — el guía no la tenía (su módulo "Compras" eran ventas a
 * clientes). Diferencias con el formulario de venta: el costo unitario lo
 * escribe el usuario (lo fija el proveedor y no es el precio de venta), no se
 * valida stock, y no hay IVA.
 */
export function VistaCompraNueva() {
  const router = useRouter();
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();

  const [idProveedor, setIdProveedor] = useState<number | null>(null);
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaEditable[]>([lineaVacia()]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: proveedoresService.listar,
  });

  // Aquí sí se incluyen los inactivos: se puede reponer un producto retirado
  // temporalmente de la tienda.
  const { data: productos = [] } = useQuery({
    queryKey: ["productos", { incluirInactivos: true }],
    queryFn: () => productosService.listar(true),
  });

  const total = useMemo(
    () =>
      lineas
        .filter((linea) => linea.id_producto !== "")
        .reduce((suma, linea) => suma + Math.round(linea.precio_unitario * linea.cantidad), 0),
    [lineas]
  );

  const mutacion = useMutation({
    mutationFn: () =>
      comprasService.crear({
        id_proveedor: idProveedor as number,
        notas: notas.trim() || null,
        items: lineas
          .filter((linea) => linea.id_producto !== "")
          .map((linea) => ({
            id_producto: linea.id_producto as number,
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
          })),
      }),
    onSuccess: (compra) => {
      avisos.exito(`Compra #${String(compra.id_compra).padStart(3, "0")} registrada`);
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["compras"] });
      router.replace(RUTAS.panelCompra(compra.id_compra));
    },
    onError: (error) => setErrorGeneral(mensajeDeError(error)),
  });

  function validar(): string | null {
    if (!idProveedor) return "Selecciona un proveedor";

    const conProducto = lineas.filter((linea) => linea.id_producto !== "");
    if (!conProducto.length) return "Agrega al menos un producto";

    if (conProducto.some((linea) => linea.precio_unitario <= 0)) {
      return "Todas las líneas necesitan un costo unitario mayor que cero";
    }

    // DECIMAL(10,2) topa en 99.999.999,99: pasarse produce un
    // "numeric field overflow" que el backend devuelve como 500.
    if (total > 99_999_999.99) {
      return "El total supera el máximo permitido. Divide la compra en varias facturas.";
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
        <h1 className="text-[1.5rem] font-semibold text-texto">Nueva Compra</h1>
        <Boton variante="neutro" onClick={() => router.push(RUTAS.panelCompras)}>
          Volver al historial
        </Boton>
      </div>

      <form onSubmit={enviar} noValidate className="grid items-start gap-5 panel:grid-cols-[1fr_340px]">
        <Tarjeta>
          <CabeceraTarjeta titulo="Mercancía recibida" />

          <Selector
            id="compra-proveedor"
            etiqueta="Proveedor"
            opciones={proveedores.map((proveedor) => ({
              valor: proveedor.id_proveedor,
              etiqueta: proveedor.nombre,
            }))}
            placeholder="Seleccionar proveedor…"
            value={idProveedor ?? ""}
            onChange={(evento) =>
              setIdProveedor(evento.target.value ? Number(evento.target.value) : null)
            }
          />

          <TablaLineas
            modo="compra"
            lineas={lineas}
            productos={productos}
            onCambiar={setLineas}
            deshabilitado={mutacion.isPending}
          />

          <AreaTexto
            id="compra-notas"
            etiqueta="Notas"
            rows={2}
            placeholder="Número de factura, observaciones…"
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
          />
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta titulo="Resumen" />

          {/* Sin IVA: el tratamiento fiscal de una factura de proveedor es otro
              asunto y la tabla `compra` no tiene dónde guardarlo. */}
          <ResumenTotales subtotal={total} total={total} conIva={false} />

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
                setIdProveedor(null);
                setNotas("");
                setLineas([lineaVacia()]);
                setErrorGeneral(null);
              }}
              disabled={mutacion.isPending}
            >
              Limpiar
            </Boton>
            <Boton type="submit" variante="acento" className="flex-1" cargando={mutacion.isPending}>
              Guardar Compra
            </Boton>
          </div>

          <p className="mt-3 text-xs text-texto-tenue">
            Al guardar se suma el stock de cada producto.
          </p>
        </Tarjeta>
      </form>
    </div>
  );
}
