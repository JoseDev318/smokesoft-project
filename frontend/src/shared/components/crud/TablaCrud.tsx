"use client";

import { useState } from "react";

import { Boton } from "@/shared/components/ui/Boton";
import { DialogoConfirmar } from "@/shared/components/ui/DialogoConfirmar";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, EstadoVacio } from "@/shared/components/ui/estados";
import { cn } from "@/shared/lib/cn";
import type { AccionExtra, ConfigCrud } from "./crud.types";
import { formatearCelda } from "./formateadores";
import type { useCrud } from "./useCrud";

type EstadoCrud<TRow, TForm extends Record<string, unknown>> =
  ReturnType<typeof useCrud<TRow, TForm>>;

interface Confirmacion<TRow> {
  fila: TRow;
  mensaje: string;
  accion: (fila: TRow) => void | Promise<void>;
  textoBoton: string;
}

export function TablaCrud<TRow, TForm extends Record<string, unknown>>({
  config,
  crud,
}: {
  config: ConfigCrud<TRow, TForm>;
  crud: EstadoCrud<TRow, TForm>;
}) {
  const [confirmacion, setConfirmacion] = useState<Confirmacion<TRow> | null>(null);

  const columnasTotales = config.columnas.length + 1; // +1 por Acciones
  const puedeEditar = config.puedeEditar ?? true;
  const puedeEliminar = config.puedeEliminar ?? true;

  function pedirBorrado(fila: TRow) {
    const etiqueta = config.etiquetaFila?.(fila) ?? `este registro`;
    setConfirmacion({
      fila,
      mensaje: `¿Seguro que quieres eliminar ${etiqueta}? Esta acción no se puede deshacer.`,
      accion: (objetivo) => crud.eliminar(objetivo),
      textoBoton: "Eliminar",
    });
  }

  function ejecutarExtra(accion: AccionExtra<TRow>, fila: TRow) {
    const mensaje = accion.confirmar?.(fila);
    if (mensaje) {
      setConfirmacion({
        fila,
        mensaje,
        accion: accion.onClick,
        textoBoton: accion.titulo,
      });
      return;
    }
    void accion.onClick(fila);
  }

  return (
    <>
      <Tarjeta>
        <CabeceraTarjeta titulo={`Lista de ${config.entidadPlural}`}>
          {(config.puedeCrear ?? true) && (
            <Boton
              variante="acento"
              className="px-4 py-2 text-[0.9rem]"
              onClick={() => {
                crud.cancelarEdicion();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              + Nuevo {config.entidad}
            </Boton>
          )}
        </CabeceraTarjeta>

        <label className="mb-4 block">
          <span className="sr-only">Buscar {config.entidadPlural.toLowerCase()}</span>
          <input
            type="search"
            value={crud.busqueda}
            onChange={(evento) => crud.setBusqueda(evento.target.value)}
            placeholder={`Buscar ${config.entidadPlural.toLowerCase()}...`}
            className="w-full rounded-admin border border-borde bg-superficie-alta px-3.5 py-2.5 text-[0.95rem] text-texto placeholder:text-texto-tenue focus:border-acento focus:outline-none"
          />
        </label>

        {crud.cargando ? (
          <Cargando />
        ) : crud.filas.length === 0 ? (
          <EstadoVacio
            titulo={config.vacio?.titulo ?? `Todavía no hay ${config.entidadPlural.toLowerCase()}`}
            mensaje={config.vacio?.mensaje ?? "Usa el formulario para registrar el primero."}
          />
        ) : (
          <>
            <div className="contenedor-tabla">
              <table className="tabla-modulo">
                <thead>
                  <tr>
                    {config.columnas.map((columna) => (
                      <th
                        key={columna.key}
                        className={columna.alinear === "der" ? "text-right" : undefined}
                      >
                        {columna.label}
                      </th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {crud.visibles.length === 0 ? (
                    <tr>
                      <td colSpan={columnasTotales} className="celda-vacia">
                        Ningún resultado para “{crud.busqueda}”
                      </td>
                    </tr>
                  ) : (
                    crud.visibles.map((fila) => (
                      <tr key={config.obtenerId(fila)}>
                        {config.columnas.map((columna) => (
                          <td
                            key={columna.key}
                            className={cn(columna.alinear === "der" && "celda-numerica")}
                          >
                            {formatearCelda(columna, fila)}
                          </td>
                        ))}
                        <td className="celda-acciones">
                          {config.accionesExtra
                            ?.filter((accion) => accion.visible?.(fila) ?? true)
                            .map((accion) => (
                              <button
                                key={accion.titulo}
                                type="button"
                                className={`btn-accion btn-accion-${accion.variante}`}
                                onClick={() => ejecutarExtra(accion, fila)}
                                // aria-label porque un emoji suelto no dice nada
                                // a un lector de pantalla.
                                aria-label={accion.titulo}
                                title={accion.titulo}
                              >
                                {accion.icono}
                              </button>
                            ))}

                          {puedeEditar && (
                            <button
                              type="button"
                              className="btn-accion btn-accion-editar"
                              onClick={() => crud.editar(fila)}
                              aria-label={`Editar ${config.entidad.toLowerCase()}`}
                              title="Editar"
                            >
                              ✎
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              className="btn-accion btn-accion-eliminar"
                              onClick={() => pedirBorrado(fila)}
                              aria-label={`Eliminar ${config.entidad.toLowerCase()}`}
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.85rem] text-texto-tenue">
                Mostrando {crud.visibles.length} de {crud.filas.length}{" "}
                {config.entidadPlural.toLowerCase()}
              </p>

              {crud.totalPaginas > 1 && (
                <div className="flex items-center gap-2">
                  <Boton
                    variante="neutro"
                    className="px-3 py-1.5 text-[0.85rem]"
                    onClick={() => crud.setPagina(crud.pagina - 1)}
                    disabled={crud.pagina <= 1}
                  >
                    Anterior
                  </Boton>
                  <span className="text-[0.85rem] text-texto-apagado">
                    {crud.pagina} / {crud.totalPaginas}
                  </span>
                  <Boton
                    variante="neutro"
                    className="px-3 py-1.5 text-[0.85rem]"
                    onClick={() => crud.setPagina(crud.pagina + 1)}
                    disabled={crud.pagina >= crud.totalPaginas}
                  >
                    Siguiente
                  </Boton>
                </div>
              )}
            </div>
          </>
        )}
      </Tarjeta>

      <DialogoConfirmar
        abierto={confirmacion !== null}
        titulo="Confirmar acción"
        mensaje={confirmacion?.mensaje ?? ""}
        textoConfirmar={confirmacion?.textoBoton ?? "Eliminar"}
        procesando={crud.eliminando}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={() => {
          if (!confirmacion) return;
          void confirmacion.accion(confirmacion.fila);
          setConfirmacion(null);
        }}
      />
    </>
  );
}
