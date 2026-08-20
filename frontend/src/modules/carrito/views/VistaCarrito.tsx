"use client";

import Image from "next/image";
import Link from "next/link";

import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, EstadoVacio } from "@/shared/components/ui/estados";
import { ResumenTotales } from "@/shared/components/lineas/ResumenTotales";
import { RUTAS, urlImagenProducto } from "@/shared/constants/rutas";
import { aNumero, formatearMoneda } from "@/shared/lib/dinero";
import { useCarrito } from "../context/ProveedorCarrito";

/**
 * Carrito. En el guía no existía: "Agregar al carrito" solo lanzaba un
 * `alert()`.
 */
export function VistaCarrito() {
  const { lineas, cargando, subtotal, iva, total, cambiarCantidad, quitar, vaciar } = useCarrito();

  if (cargando) return <Cargando />;

  if (lineas.length === 0) {
    return (
      <div className="mx-auto w-[90%] max-w-[900px] px-5 py-12">
        <Tarjeta>
          <EstadoVacio
            titulo="Tu carrito está vacío"
            mensaje="Explora el catálogo y agrega los productos que quieras."
          >
            <Link href={RUTAS.productos} className="btn btn-acento">
              Ver productos
            </Link>
          </EstadoVacio>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[90%] max-w-[1000px] px-5 py-8">
      <h1 className="mb-5 text-[1.8rem] font-bold text-acento">Tu carrito</h1>

      <div className="grid items-start gap-5 panel:grid-cols-[1fr_320px]">
        <Tarjeta>
          <CabeceraTarjeta titulo={`${lineas.length} producto${lineas.length === 1 ? "" : "s"}`}>
            <button
              type="button"
              onClick={vaciar}
              className="cursor-pointer text-[0.85rem] font-semibold text-peligro hover:underline"
            >
              Vaciar carrito
            </button>
          </CabeceraTarjeta>

          <ul className="flex flex-col gap-4">
            {lineas.map((linea) => {
              const imagen = urlImagenProducto(linea.imagen);

              return (
                <li
                  key={linea.id_producto}
                  className="flex flex-wrap items-center gap-4 border-b border-borde-suave pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-admin bg-tarjeta-clara">
                    {imagen ? (
                      <Image
                        src={imagen}
                        alt=""
                        width={64}
                        height={64}
                        className="size-14 object-contain"
                      />
                    ) : (
                      <span className="text-2xl" aria-hidden="true">📦</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={RUTAS.producto(linea.id_producto)}
                      className="block truncate font-semibold text-texto hover:text-acento"
                    >
                      {linea.nombre}
                    </Link>
                    <p className="text-sm text-texto-apagado">
                      {formatearMoneda(linea.precio)} por unidad
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor={`cant-${linea.id_producto}`} className="sr-only">
                      Cantidad de {linea.nombre}
                    </label>
                    <input
                      id={`cant-${linea.id_producto}`}
                      type="number"
                      min={1}
                      // El tope es el stock que se conocía al agregar: en el
                      // checkout se vuelve a comprobar contra el dato fresco.
                      max={linea.stockConocido}
                      value={linea.cantidad}
                      onChange={(evento) =>
                        cambiarCantidad(linea.id_producto, Math.trunc(Number(evento.target.value)))
                      }
                      className="w-20 rounded-admin border border-borde bg-superficie-alta px-2.5 py-1.5 text-center text-texto focus:border-acento focus:outline-none"
                    />
                    <button
                      type="button"
                      className="btn-accion btn-accion-eliminar"
                      onClick={() => quitar(linea.id_producto)}
                      aria-label={`Quitar ${linea.nombre} del carrito`}
                      title="Quitar"
                    >
                      🗑
                    </button>
                  </div>

                  <p className="w-full text-right font-semibold text-texto movil:w-24">
                    {formatearMoneda(linea.cantidad * aNumero(linea.precio))}
                  </p>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta titulo="Resumen" />
          <ResumenTotales subtotal={subtotal} iva={iva} total={total} />

          <Link href={RUTAS.checkout} className="btn btn-acento btn-publico">
            Continuar
          </Link>

          <Link
            href={RUTAS.productos}
            className="mt-3 block text-center text-[0.9rem] text-texto-secundario hover:text-acento"
          >
            Seguir comprando
          </Link>
        </Tarjeta>
      </div>
    </div>
  );
}
