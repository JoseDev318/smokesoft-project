"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mensajeDeError } from "@/shared/api/errores";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import { CONFIG } from "@/shared/constants/config";
import type { ConfigCrud } from "./crud.types";
import { textoDeCampo } from "./formateadores";

/**
 * Estado y operaciones del módulo CRUD.
 *
 * `filaEditando` vive en el estado de ESTE hook, es decir una por instancia.
 * En el guía era una variable en scope de módulo compartida por sus cuatro
 * CRUDs, así que editar un producto y luego pulsar editar en usuarios
 * arrastraba el id anterior.
 */
export function useCrud<TRow, TForm extends Record<string, unknown>>(
  config: ConfigCrud<TRow, TForm>
) {
  const clienteQuery = useQueryClient();
  const avisos = useAvisos();

  const [filaEditando, setFilaEditando] = useState<TRow | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const termino = useDebounce(busqueda);

  const porPagina = config.porPagina ?? CONFIG.porPagina;
  const claveLista = useMemo(() => [config.clave], [config.clave]);

  const consulta = useQuery({
    queryKey: claveLista,
    queryFn: config.servicio.listar,
  });

  const invalidar = useCallback(() => {
    void clienteQuery.invalidateQueries({ queryKey: claveLista });
    // Invalidaciones cruzadas: guardar un producto cambia el dashboard, por
    // ejemplo. Es el equivalente del `onChange` del guía.
    for (const clave of config.clavesAInvalidar ?? []) {
      void clienteQuery.invalidateQueries({ queryKey: clave });
    }
  }, [clienteQuery, claveLista, config.clavesAInvalidar]);

  const articulo = config.genero === "f" ? "La" : "El";

  const mutacionGuardar = useMutation({
    mutationFn: async (valores: TForm) => {
      if (filaEditando) {
        const id = config.obtenerId(filaEditando);
        return config.servicio.actualizar(id, config.aDtoActualizar(valores) as never);
      }
      return config.servicio.crear(config.aDtoCrear(valores) as never);
    },
    onSuccess: () => {
      avisos.exito(
        filaEditando
          ? `${articulo} ${config.entidad.toLowerCase()} se actualizó`
          : `${articulo} ${config.entidad.toLowerCase()} se registró`
      );
      setFilaEditando(null);
      invalidar();
    },
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  const mutacionEliminar = useMutation({
    mutationFn: (fila: TRow) => config.servicio.eliminar(config.obtenerId(fila)),
    onSuccess: (_datos, fila) => {
      avisos.exito(`${articulo} ${config.entidad.toLowerCase()} se eliminó`);
      // Si se borra justo lo que se estaba editando, el formulario debe volver
      // a modo "crear" o guardaría contra un id inexistente.
      if (filaEditando && config.obtenerId(filaEditando) === config.obtenerId(fila)) {
        setFilaEditando(null);
      }
      invalidar();
    },
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  // Memorizado para que el `?? []` no cree un array nuevo en cada render y
  // dispare el filtrado sin necesidad.
  const filas = useMemo(() => consulta.data ?? [], [consulta.data]);

  const filtradas = useMemo(() => {
    const texto = termino.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((fila) =>
      config.camposBusqueda.some((campo) => textoDeCampo(fila, campo).includes(texto))
    );
  }, [filas, termino, config.camposBusqueda]);

  // La API devuelve la tabla entera sin paginar: 500 filas en un solo <table>
  // es una mala experiencia, así que se pagina aquí.
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const editar = useCallback((fila: TRow) => {
    setFilaEditando(fila);
    // El formulario está arriba en móvil: sin esto, pulsar editar en una fila
    // baja no parece hacer nada.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    filas, filtradas, visibles,
    cargando: consulta.isLoading,
    error: consulta.error,
    recargar: consulta.refetch,

    filaEditando,
    editar,
    cancelarEdicion: () => setFilaEditando(null),

    busqueda,
    setBusqueda: (valor: string) => { setBusqueda(valor); setPagina(1); },

    pagina: paginaSegura,
    totalPaginas,
    setPagina,
    porPagina,

    guardar: (valores: TForm) => mutacionGuardar.mutateAsync(valores),
    guardando: mutacionGuardar.isPending,
    eliminar: (fila: TRow) => mutacionEliminar.mutate(fila),
    eliminando: mutacionEliminar.isPending,
  };
}
