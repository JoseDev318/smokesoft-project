"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCarrito } from "@/modules/carrito/context/ProveedorCarrito";
import { Boton } from "@/shared/components/ui/Boton";
import { Insignia } from "@/shared/components/ui/estados";
import { RUTAS, urlImagenProducto } from "@/shared/constants/rutas";
import { formatearMoneda } from "@/shared/lib/dinero";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { CategoriaFila, ProductoFila } from "@/shared/types/bd.types";

/**
 * Detalle de producto. Vista NUEVA: el guía no la tenía (sus tarjetas no
 * enlazaban a ningún sitio), pero es necesaria para un carrito real con
 * selección de cantidad.
 */
export function VistaProductoDetalle({
  producto,
  categoria,
}: {
  producto: ProductoFila;
  categoria: CategoriaFila | null;
}) {
  const { agregar } = useCarrito();
  const avisos = useAvisos();
  const [cantidad, setCantidad] = useState(1);

  const imagen = urlImagenProducto(producto.imagen);
  const sinExistencias = producto.stock <= 0;
  const stockBajo = producto.stock <= producto.stock_minimo && !sinExistencias;

  function alAgregar() {
    agregar(
      {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        stockConocido: producto.stock,
      },
      cantidad
    );
    avisos.exito(
      cantidad === 1
        ? `${producto.nombre} se agregó al carrito`
        : `${cantidad} × ${producto.nombre} se agregaron al carrito`
    );
  }

  return (
    <div className="mx-auto w-[90%] max-w-[1000px] px-5 py-8">
      <nav className="mb-6 text-sm text-texto-secundario">
        <Link href={RUTAS.productos} className="transition-colors hover:text-acento">
          ← Volver a productos
        </Link>
      </nav>

      <div className="grid gap-8 panel:grid-cols-2">
        <div className="flex items-center justify-center rounded-tarjeta bg-tarjeta-clara p-8">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              width={420}
              height={360}
              className="max-h-[360px] w-full object-contain"
              priority
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-7xl" aria-hidden="true">
              📦
            </div>
          )}
        </div>

        <div className="rounded-tarjeta border border-borde-suave bg-superficie p-6">
          {categoria && (
            <p className="mb-2 text-sm text-texto-apagado">{categoria.nombre}</p>
          )}

          <h1 className="mb-3 text-2xl font-bold text-texto">{producto.nombre}</h1>

          <p className="mb-4 text-[1.8rem] font-bold text-acento">
            {formatearMoneda(producto.precio)}
          </p>

          {producto.descripcion && (
            <p className="mb-5 text-sm leading-relaxed text-texto-secundario">
              {producto.descripcion}
            </p>
          )}

          <p className="mb-6 flex items-center gap-2 text-sm text-texto-apagado">
            {sinExistencias ? (
              <Insignia tono="peligro">Sin existencias</Insignia>
            ) : (
              <>
                <span>Existencias: {producto.stock} unidades</span>
                {stockBajo && <Insignia tono="alerta">Últimas unidades</Insignia>}
              </>
            )}
          </p>

          {!sinExistencias && (
            <div className="mb-5 flex items-center gap-3">
              <label htmlFor="cantidad" className="text-sm text-texto-secundario">
                Cantidad
              </label>
              <input
                id="cantidad"
                type="number"
                min={1}
                // El tope es el stock real: el backend rechazaría la venta con
                // un 409 y es mejor no dejar llegar ahí.
                max={producto.stock}
                value={cantidad}
                onChange={(evento) => {
                  const valor = Number(evento.target.value);
                  if (!Number.isFinite(valor)) return;
                  setCantidad(Math.min(Math.max(1, Math.trunc(valor)), producto.stock));
                }}
                className="w-20 rounded-admin border border-borde bg-superficie-alta px-3 py-2 text-texto focus:border-acento focus:outline-none"
              />
            </div>
          )}

          <Boton variante="acento" publico onClick={alAgregar} disabled={sinExistencias}>
            {sinExistencias ? "Sin existencias" : "Agregar al carrito"}
          </Boton>
        </div>
      </div>
    </div>
  );
}
