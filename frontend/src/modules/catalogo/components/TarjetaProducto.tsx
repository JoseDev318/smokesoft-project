"use client";

import Image from "next/image";
import Link from "next/link";

import { useCarrito } from "@/modules/carrito/context/ProveedorCarrito";
import { Boton } from "@/shared/components/ui/Boton";
import { RUTAS, urlImagenProducto } from "@/shared/constants/rutas";
import { formatearMoneda } from "@/shared/lib/dinero";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { ProductoVista } from "@/shared/types/bd.types";

/**
 * Tarjeta blanca del catálogo: la única superficie clara de la aplicación.
 *
 * El guía siempre mostraba el botón "Agregar al carrito", incluso sin
 * existencias, y su acción era un `alert()`. Aquí el botón se deshabilita
 * cuando el stock es 0 y agrega de verdad al carrito.
 */
export function TarjetaProducto({ producto }: { producto: ProductoVista }) {
  const { agregar } = useCarrito();
  const avisos = useAvisos();

  const imagen = urlImagenProducto(producto.imagen);

  function alAgregar() {
    agregar({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      stockConocido: producto.stock,
    });
    avisos.exito(`${producto.nombre} se agregó al carrito`);
  }

  return (
    <article className="tarjeta-producto">
      {producto.sinExistencias ? (
        <span className="etiqueta-producto etiqueta-producto--oferta">AGOTADO</span>
      ) : producto.stockBajo ? (
        <span className="etiqueta-producto etiqueta-producto--nuevo">ÚLTIMAS</span>
      ) : null}

      <Link href={RUTAS.producto(producto.id_producto)} className="block">
        {imagen ? (
          <Image
            src={imagen}
            alt={producto.nombre}
            width={220}
            height={180}
            className="mx-auto h-[180px] w-full object-contain"
          />
        ) : (
          // Respaldo cuando el producto no tiene imagen asignada: el guía tenía
          // fotos fijas en el HTML, pero la base de datos permite null.
          <div
            className="mb-2.5 flex h-[180px] items-center justify-center text-5xl"
            aria-hidden="true"
          >
            📦
          </div>
        )}
        <h3 className="tarjeta-producto__nombre">{producto.nombre}</h3>
      </Link>

      <p className="tarjeta-producto__categoria">{producto.categoriaNombre}</p>

      <p>
        <span className="tarjeta-producto__precio">{formatearMoneda(producto.precio)}</span>
      </p>

      <p className="tarjeta-producto__existencias">
        {producto.sinExistencias
          ? "Sin existencias"
          : `Existencias: ${producto.stock} unidades`}
      </p>

      <div className="tarjeta-producto__pie">
        <Boton
          variante="acento"
          publico
          onClick={alAgregar}
          disabled={producto.sinExistencias}
        >
          {producto.sinExistencias ? "Sin existencias" : "Agregar al carrito"}
        </Boton>
      </div>
    </article>
  );
}
