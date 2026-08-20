"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientesService } from "@/modules/clientes/services/clientes.service";
import { catalogoService } from "@/modules/catalogo/services/catalogo.service";
import { ventasService } from "@/modules/ventas/services/ventas.service";
import { mensajeDeError } from "@/shared/api/errores";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { Boton } from "@/shared/components/ui/Boton";
import { AreaTexto } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, EstadoVacio, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { aNumero, formatearMoneda } from "@/shared/lib/dinero";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import { useCarrito } from "../context/ProveedorCarrito";

/** Discrepancia entre la foto guardada en el carrito y el catálogo actual. */
interface Diferencia {
  id_producto: number;
  tipo: "precio" | "stock" | "no-disponible";
  texto: string;
  /** Existencias reales, para ofrecer el ajuste con un clic. */
  stock: number;
}

/**
 * Confirmación del pedido.
 *
 * El carrito guarda una FOTO del precio y del stock del momento en que se
 * agregó cada producto. Aquí se vuelve a consultar el catálogo para detectar si
 * algo cambió mientras el visitante compraba, y se avisa antes de enviar: el
 * backend recalcula con sus propios precios y rechaza con 409 si falta stock.
 */
export function VistaCheckout() {
  const router = useRouter();
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();
  const { lineas, cargando, subtotal, iva, total, vaciar, cambiarCantidad } = useCarrito();

  const [notas, setNotas] = useState("");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const ficha = useQuery({ queryKey: ["clientes", "mio"], queryFn: clientesService.miFicha });

  // Datos frescos del catálogo para comparar contra la foto del carrito.
  const catalogo = useQuery({
    queryKey: ["catalogo", "productos"],
    queryFn: catalogoService.listarProductos,
  });

  const diferencias = useMemo<Diferencia[]>(() => {
    const porId = new Map((catalogo.data ?? []).map((p) => [p.id_producto, p]));

    return lineas.flatMap<Diferencia>((linea) => {
      const actual = porId.get(linea.id_producto);

      if (!actual || !actual.activo) {
        return [{
          id_producto: linea.id_producto,
          tipo: "no-disponible",
          texto: `"${linea.nombre}" ya no está disponible.`,
          stock: 0,
        }];
      }

      const avisosLinea: Diferencia[] = [];

      if (aNumero(actual.precio) !== aNumero(linea.precio)) {
        avisosLinea.push({
          id_producto: linea.id_producto,
          tipo: "precio",
          texto: `"${linea.nombre}" cambió de ${formatearMoneda(linea.precio)} a ${formatearMoneda(actual.precio)}.`,
          stock: actual.stock,
        });
      }

      if (linea.cantidad > actual.stock) {
        avisosLinea.push({
          id_producto: linea.id_producto,
          tipo: "stock",
          texto: `De "${linea.nombre}" quedan ${actual.stock} unidades y pediste ${linea.cantidad}.`,
          stock: actual.stock,
        });
      }

      return avisosLinea;
    });
  }, [lineas, catalogo.data]);

  const bloqueado = diferencias.some(
    (diferencia) => diferencia.tipo === "stock" || diferencia.tipo === "no-disponible"
  );

  const mutacion = useMutation({
    mutationFn: () =>
      ventasService.crear({
        // El backend ignora este id_cliente para un rol 'Cliente' y usa el del
        // token, así que no hay forma de comprar a nombre de otro.
        id_cliente: ficha.data?.id_cliente ?? 0,
        notas: notas.trim() || null,
        items: lineas.map((linea) => ({
          id_producto: linea.id_producto,
          cantidad: linea.cantidad,
        })),
      }),
    onSuccess: (venta) => {
      vaciar();
      avisos.exito("¡Pedido confirmado!");
      // El stock cambió: el catálogo quedó obsoleto.
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["ventas", "mias"] });
      // `replace` para que el botón Atrás no reenvíe el pedido.
      router.replace(RUTAS.confirmacion(venta.id_venta));
    },
    onError: (error) => setErrorGeneral(mensajeDeError(error)),
  });

  if (cargando || ficha.isLoading) return <Cargando />;

  if (lineas.length === 0) {
    return (
      <div className="mx-auto w-[90%] max-w-[700px] px-5 py-12">
        <Tarjeta>
          <EstadoVacio titulo="No hay nada que confirmar" mensaje="Tu carrito está vacío.">
            <Link href={RUTAS.productos} className="btn btn-acento">Ver productos</Link>
          </EstadoVacio>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[90%] max-w-[1000px] px-5 py-8">
      <h1 className="mb-5 text-[1.8rem] font-bold text-acento">Confirmar pedido</h1>

      <div className="grid items-start gap-5 panel:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Datos de entrega">
              <Link
                href={RUTAS.misDatos}
                className="text-[0.85rem] font-semibold text-acento hover:underline"
              >
                Editar
              </Link>
            </CabeceraTarjeta>

            {ficha.error ? (
              <MensajeError mensaje={mensajeDeError(ficha.error)} />
            ) : (
              <dl className="space-y-2 text-sm">
                <Dato etiqueta="Nombre" valor={ficha.data?.nombre ?? "—"} />
                <Dato etiqueta="Correo" valor={ficha.data?.correo ?? "—"} />
                <Dato etiqueta="Teléfono" valor={ficha.data?.telefono ?? "—"} />
                <Dato etiqueta="Dirección" valor={ficha.data?.direccion ?? "Sin dirección registrada"} />
              </dl>
            )}
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta titulo="Productos" />
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea) => (
                    <tr key={linea.id_producto}>
                      <td>{linea.nombre}</td>
                      <td className="celda-numerica">{linea.cantidad}</td>
                      <td className="celda-numerica">{formatearMoneda(linea.precio)}</td>
                      <td className="celda-numerica">
                        {formatearMoneda(linea.cantidad * aNumero(linea.precio))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          <Tarjeta>
            <AreaTexto
              id="checkout-notas"
              etiqueta="Notas para el pedido (opcional)"
              rows={2}
              placeholder="Indicaciones de entrega, referencias…"
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
            />
          </Tarjeta>
        </div>

        <Tarjeta>
          <CabeceraTarjeta titulo="Total a pagar" />
          <ResumenTotales subtotal={subtotal} iva={iva} total={total} />

          {diferencias.length > 0 && (
            <div className="mb-4 rounded-admin bg-alerta/15 px-3 py-2.5" role="alert">
              <p className="mb-1.5 text-[0.85rem] font-semibold text-alerta">
                Algo cambió mientras comprabas
              </p>
              <ul className="space-y-1.5 text-[0.8rem] text-texto-secundario">
                {diferencias.map((diferencia, indice) => (
                  <li key={`${diferencia.id_producto}-${indice}`}>
                    {diferencia.texto}
                    {diferencia.tipo === "stock" && diferencia.stock > 0 && (
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(diferencia.id_producto, diferencia.stock)}
                        className="ml-1 cursor-pointer font-semibold text-acento underline"
                      >
                        Ajustar a {diferencia.stock}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorGeneral && (
            <p className="mb-4 text-[0.9rem] text-peligro" role="alert">
              {errorGeneral}
            </p>
          )}

          <Boton
            variante="acento"
            publico
            onClick={() => { setErrorGeneral(null); mutacion.mutate(); }}
            disabled={bloqueado}
            cargando={mutacion.isPending}
          >
            Confirmar pedido
          </Boton>

          {/* La barra de servicios anuncia Bold/Nequi/PSE, pero no hay ninguna
              integración de pagos: se entrega como pago contra entrega. */}
          <p className="mt-3 text-center text-xs text-texto-tenue">
            Pago contra entrega. Nos pondremos en contacto para coordinar el envío.
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-texto-apagado">{etiqueta}</dt>
      <dd className="text-right text-texto">{valor}</dd>
    </div>
  );
}
