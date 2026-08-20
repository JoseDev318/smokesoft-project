"use client";

import { useMemo, useState } from "react";

import { mensajeDeError } from "@/shared/api/errores";
import { EstadoVacio, MensajeError } from "@/shared/components/ui/estados";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/lib/cn";
import type { CategoriaFila, ProductoFila } from "@/shared/types/bd.types";
import { TarjetaProducto } from "../components/TarjetaProducto";
import { useCatalogo } from "../hooks/useCatalogo";

interface Props {
  productosIniciales?: ProductoFila[];
  categoriasIniciales?: CategoriaFila[];
}

/**
 * Catálogo público.
 *
 * Diferencias con contenido.html del guía: los productos son reales (allí eran
 * 8 tarjetas escritas a mano), la búsqueda filtra mientras se escribe (allí
 * había que pulsar "Buscar" y el filtrado era un `display:none` sobre el DOM),
 * y hay filtro por categoría.
 */
export function VistaCatalogo({ productosIniciales, categoriasIniciales }: Props) {
  const { productos, categorias, cargando, error, recargar } = useCatalogo(
    productosIniciales,
    categoriasIniciales
  );

  const [busqueda, setBusqueda] = useState("");
  const [idCategoria, setIdCategoria] = useState<number | null>(null);
  const termino = useDebounce(busqueda);

  const visibles = useMemo(() => {
    const texto = termino.trim().toLowerCase();

    return productos.filter((producto) => {
      if (idCategoria !== null && producto.id_categoria !== idCategoria) return false;
      if (!texto) return true;
      return (
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoriaNombre.toLowerCase().includes(texto) ||
        (producto.descripcion ?? "").toLowerCase().includes(texto)
      );
    });
  }, [productos, termino, idCategoria]);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] px-5 py-8">
      <h1 className="mb-2.5 text-center text-[2rem] font-bold text-acento">
        Nuestros Productos
      </h1>
      <p className="mb-8 text-center text-texto">Los mejores productos para fumadores</p>

      <div className="mb-6 flex justify-center">
        <label className="w-full max-w-[380px]">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-publico border-2 border-acento bg-superficie-alta px-4 py-2.5 text-base text-texto placeholder:text-texto-tenue focus:outline-none"
          />
        </label>
      </div>

      {categorias.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <ChipCategoria
            activo={idCategoria === null}
            onClick={() => setIdCategoria(null)}
          >
            Todas
          </ChipCategoria>
          {categorias.map((categoria) => (
            <ChipCategoria
              key={categoria.id_categoria}
              activo={idCategoria === categoria.id_categoria}
              onClick={() => setIdCategoria(categoria.id_categoria)}
            >
              {categoria.nombre}
            </ChipCategoria>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-lg">
          <MensajeError mensaje={mensajeDeError(error)} onReintentar={recargar} />
        </div>
      )}

      {!error && cargando && productos.length === 0 && (
        <GrillaEsqueleto />
      )}

      {!error && !cargando && visibles.length === 0 && (
        <EstadoVacio
          titulo="No encontramos productos"
          mensaje={
            termino || idCategoria !== null
              ? "Prueba con otra búsqueda o quita el filtro de categoría."
              : "Todavía no hay productos publicados en la tienda."
          }
        />
      )}

      {visibles.length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-6">
            {visibles.map((producto) => (
              <TarjetaProducto key={producto.id_producto} producto={producto} />
            ))}
          </div>
          <p className="mt-8 text-center text-[0.85rem] text-texto-secundario">
            Mostrando {visibles.length} de {productos.length} productos
          </p>
        </>
      )}
    </div>
  );
}

function ChipCategoria({
  activo, onClick, children,
}: {
  activo: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "cursor-pointer rounded-publico px-3.5 py-1.5 text-sm font-medium transition-colors",
        activo
          ? "bg-acento text-sobre-acento"
          : "bg-superficie-alta text-texto-secundario hover:bg-acento-menu hover:text-texto"
      )}
    >
      {children}
    </button>
  );
}

/** Esqueleto con las medidas de la tarjeta real, para que no salte el layout. */
function GrillaEsqueleto() {
  return (
    <div className="flex flex-wrap justify-center gap-6" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, indice) => (
        <div
          key={indice}
          className="h-[420px] w-[250px] animate-pulse rounded-tarjeta bg-superficie"
        />
      ))}
    </div>
  );
}
