"use client";

import { useCallback, useMemo, useState } from "react";
import type { ZodType } from "zod";

/**
 * Formulario con validación zod.
 *
 * Se prefiere esto a react-hook-form porque los campos del CRUD genérico se
 * generan dinámicamente desde una configuración, y registrar campos dinámicos
 * en RHF es más pelea que provecho. Aquí son ~70 líneas sobre useState.
 */

export type ErroresFormulario<T> = Partial<Record<keyof T & string, string>>;

interface Opciones<T> {
  valoresIniciales: T;
  esquema: ZodType<T>;
  alEnviar: (valores: T) => Promise<void> | void;
}

export function useFormulario<T extends Record<string, unknown>>({
  valoresIniciales,
  esquema,
  alEnviar,
}: Opciones<T>) {
  const [valores, setValores] = useState<T>(valoresIniciales);
  const [errores, setErrores] = useState<ErroresFormulario<T>>({});
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);

  const validar = useCallback((datos: T): ErroresFormulario<T> => {
    const resultado = esquema.safeParse(datos);
    if (resultado.success) return {};

    const nuevos: ErroresFormulario<T> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0];
      if (typeof campo === "string" && !nuevos[campo as keyof T & string]) {
        nuevos[campo as keyof T & string] = problema.message;
      }
    }
    return nuevos;
  }, [esquema]);

  const cambiar = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    setValores((previos) => {
      const siguientes = { ...previos, [campo]: valor };
      // Solo se revalida un campo que ya fue tocado: escribir la primera letra
      // de un campo vacío no debe pintarlo en rojo.
      setErrores((erroresPrevios) => {
        if (!tocados.has(String(campo))) return erroresPrevios;
        const revalidados = validar(siguientes);
        return { ...erroresPrevios, [campo]: revalidados[campo as keyof T & string] };
      });
      return siguientes;
    });
  }, [tocados, validar]);

  const marcarTocado = useCallback((campo: keyof T & string) => {
    setTocados((previos) => new Set(previos).add(campo));
    setErrores((previos) => ({ ...previos, [campo]: validar(valores)[campo] }));
  }, [valores, validar]);

  const enviar = useCallback(async (evento?: React.FormEvent) => {
    evento?.preventDefault();

    const encontrados = validar(valores);
    // Al enviar se marcan todos como tocados, así los errores de campos que el
    // usuario nunca tocó también se muestran.
    setTocados(new Set(Object.keys(valores)));
    setErrores(encontrados);

    if (Object.keys(encontrados).length > 0) return false;

    setEnviando(true);
    try {
      await alEnviar(valores);
      return true;
    } finally {
      setEnviando(false);
    }
  }, [valores, validar, alEnviar]);

  const reiniciar = useCallback((nuevos?: T) => {
    setValores(nuevos ?? valoresIniciales);
    setErrores({});
    setTocados(new Set());
  }, [valoresIniciales]);

  const hayErrores = useMemo(() => Object.values(errores).some(Boolean), [errores]);

  return {
    valores, errores, enviando, hayErrores,
    cambiar, marcarTocado, enviar, reiniciar, setValores,
  };
}
