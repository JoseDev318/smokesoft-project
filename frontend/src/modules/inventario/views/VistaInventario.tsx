"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import { categoriasService } from "@/modules/categorias/services/categorias.service";
import { productosService } from "@/modules/productos/services/productos.service";
import { mensajeDeError } from "@/shared/api/errores";
import { Boton } from "@/shared/components/ui/Boton";
import { CampoTexto } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { TejaDato } from "@/shared/components/ui/TejaDato";
import { Cargando, Insignia, MensajeError } from "@/shared/components/ui/estados";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { formatearNumero } from "@/shared/lib/dinero";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { ProductoFila } from "@/shared/types/bd.types";

/**
 * Inventario. Vista nueva: el backend ya tenía /productos/stock-bajo y el guía
 * no lo usaba, y hasta ahora no había forma de corregir el stock desde la API
 * (el PUT de productos lo omite a propósito).
 *
 * El ajuste va por PATCH /productos/:id/stock con un DELTA CON SIGNO, no con la
 * existencia final: así dos ajustes simultáneos se suman en lugar de
 * sobreescribirse.
 */
export function VistaInventario() {
  const { usuario } = useSesion();
  const puedeAjustar = puede(usuario?.rol, "inventario", "escribir");

  const [busqueda, setBusqueda] = useState("");
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [enAjuste, setEnAjuste] = useState<ProductoFila | null>(null);
  const termino = useDebounce(busqueda);

  const productos = useQuery({
    queryKey: ["productos", { incluirInactivos: true }],
    queryFn: () => productosService.listar(true),
  });

  const resumen = useQuery({ queryKey: ["productos", "resumen"], queryFn: productosService.resumen });

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: categoriasService.listar });
  const nombresCategoria = useMemo(
    () => new Map((categorias.data ?? []).map((c) => [c.id_categoria, c.nombre])),
    [categorias.data]
  );

  const visibles = useMemo(() => {
    const texto = termino.trim().toLowerCase();
    return (productos.data ?? []).filter((producto) => {
      if (soloStockBajo && producto.stock > producto.stock_minimo) return false;
      if (!texto) return true;
      return producto.nombre.toLowerCase().includes(texto);
    });
  }, [productos.data, termino, soloStockBajo]);

  return (
    <div>
      <h1 className="mb-5 text-[1.5rem] font-semibold text-texto">Inventario</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <TejaDato etiqueta="Productos" valor={formatearNumero(resumen.data?.total)} />
        <TejaDato etiqueta="Activos" valor={formatearNumero(resumen.data?.activos)} />
        <TejaDato etiqueta="Existencias" valor={formatearNumero(resumen.data?.existencias)} />
        <TejaDato etiqueta="Stock bajo" valor={formatearNumero(resumen.data?.stock_bajo)} />
      </div>

      {productos.error && (
        <div className="mb-5">
          <MensajeError
            mensaje={mensajeDeError(productos.error)}
            onReintentar={() => void productos.refetch()}
          />
        </div>
      )}

      <Tarjeta>
        <CabeceraTarjeta titulo="Existencias por producto">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-texto-secundario">
            <input
              type="checkbox"
              checked={soloStockBajo}
              onChange={(evento) => setSoloStockBajo(evento.target.checked)}
              className="size-4 accent-acento"
            />
            Solo stock bajo
          </label>
        </CabeceraTarjeta>

        <label className="mb-4 block">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-admin border border-borde bg-superficie-alta px-3.5 py-2.5 text-[0.95rem] text-texto placeholder:text-texto-tenue focus:border-acento focus:outline-none"
          />
        </label>

        {productos.isLoading ? (
          <Cargando />
        ) : (
          <div className="contenedor-tabla">
            <table className="tabla-modulo">
              <thead>
                <tr>
                  <th>Producto</th><th>Categoría</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Mínimo</th>
                  <th>Estado</th>
                  {puedeAjustar && <th>Ajuste</th>}
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={puedeAjustar ? 6 : 5} className="celda-vacia">
                      {soloStockBajo
                        ? "Todo el inventario está por encima del mínimo"
                        : "Ningún producto coincide"}
                    </td>
                  </tr>
                ) : (
                  visibles.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td>{producto.nombre}</td>
                      <td>
                        {producto.id_categoria
                          ? nombresCategoria.get(producto.id_categoria) ?? "—"
                          : "—"}
                      </td>
                      <td className="celda-numerica font-semibold">{producto.stock}</td>
                      <td className="celda-numerica">{producto.stock_minimo}</td>
                      <td>
                        {!producto.activo ? (
                          <Insignia tono="neutro">Inactivo</Insignia>
                        ) : producto.stock <= 0 ? (
                          <Insignia tono="peligro">Agotado</Insignia>
                        ) : producto.stock <= producto.stock_minimo ? (
                          <Insignia tono="alerta">Stock bajo</Insignia>
                        ) : (
                          <Insignia tono="exito">Suficiente</Insignia>
                        )}
                      </td>
                      {puedeAjustar && (
                        <td className="celda-acciones">
                          <button
                            type="button"
                            className="btn-accion btn-accion-editar"
                            onClick={() => setEnAjuste(producto)}
                            aria-label={`Ajustar el stock de ${producto.nombre}`}
                            title="Ajustar stock"
                          >
                            ⚖
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-[0.85rem] text-texto-tenue">
          Mostrando {visibles.length} de {(productos.data ?? []).length} productos
        </p>
      </Tarjeta>

      {enAjuste && (
        <DialogoAjuste producto={enAjuste} onCerrar={() => setEnAjuste(null)} />
      )}
    </div>
  );
}

function DialogoAjuste({
  producto,
  onCerrar,
}: {
  producto: ProductoFila;
  onCerrar: () => void;
}) {
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();
  const [texto, setTexto] = useState("");
  const [motivo, setMotivo] = useState("");

  const delta = Math.trunc(Number(texto));
  const valido = texto.trim() !== "" && Number.isInteger(delta) && delta !== 0;
  const resultado = producto.stock + (Number.isFinite(delta) ? delta : 0);
  const dejaNegativo = valido && resultado < 0;

  const mutacion = useMutation({
    mutationFn: () =>
      productosService.ajustarStock(producto.id_producto, {
        cantidad: delta,
        // `motivo` se envía pero el backend lo ignora: no hay tabla de
        // movimientos todavía. Se manda para que el día que exista, el
        // frontend no tenga que cambiar.
        motivo: motivo.trim() || undefined,
      }),
    onSuccess: (actualizado) => {
      avisos.exito(`"${producto.nombre}" quedó en ${actualizado.stock} unidades`);
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
      onCerrar();
    },
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-tarjeta border border-borde-suave bg-superficie p-6">
        <h2 className="mb-1 text-[1.1rem] font-semibold text-texto">Ajustar stock</h2>
        <p className="mb-5 text-sm text-texto-apagado">
          {producto.nombre} — actualmente {producto.stock} unidades
        </p>

        <CampoTexto
          id="ajuste-cantidad"
          etiqueta="Cantidad a ajustar"
          type="number"
          step={1}
          placeholder="Ej: 10 para sumar, -3 para restar"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          ayuda="Positivo suma, negativo resta. No es la existencia final."
          error={dejaNegativo ? "El ajuste dejaría el stock en negativo" : undefined}
        />

        <CampoTexto
          id="ajuste-motivo"
          etiqueta="Motivo (opcional)"
          placeholder="Ej: producto roto en bodega"
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
        />

        {valido && !dejaNegativo && (
          <p className="mb-4 rounded-admin bg-superficie-alta px-3 py-2 text-sm text-texto-secundario">
            Quedará en <strong className="text-acento">{resultado}</strong> unidades
          </p>
        )}

        <div className="flex justify-end gap-2.5">
          <Boton variante="neutro" onClick={onCerrar} disabled={mutacion.isPending}>
            Cancelar
          </Boton>
          <Boton
            variante="acento"
            onClick={() => mutacion.mutate()}
            disabled={!valido || dejaNegativo}
            cargando={mutacion.isPending}
          >
            Aplicar ajuste
          </Boton>
        </div>
      </div>
    </div>
  );
}
