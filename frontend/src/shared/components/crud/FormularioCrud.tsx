"use client";

import { useEffect } from "react";

import { Boton } from "@/shared/components/ui/Boton";
import { AreaTexto, CampoTexto, Casilla, Selector } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { useFormulario } from "@/shared/hooks/useFormulario";
import type { CampoCrud, ConfigCrud, TipoCampo } from "./crud.types";

const TIPO_HTML: Partial<Record<TipoCampo, string>> = {
  texto: "text",
  correo: "email",
  tel: "tel",
  numero: "number",
  clave: "password",
};

export function FormularioCrud<TRow, TForm extends Record<string, unknown>>({
  config,
  filaEditando,
  guardando,
  onGuardar,
  onCancelar,
}: {
  config: ConfigCrud<TRow, TForm>;
  filaEditando: TRow | null;
  guardando: boolean;
  onGuardar: (valores: TForm) => Promise<unknown>;
  onCancelar: () => void;
}) {
  const editando = filaEditando !== null;

  const formulario = useFormulario<TForm>({
    valoresIniciales: config.valoresIniciales,
    esquema: config.esquema,
    alEnviar: async (valores) => {
      await onGuardar(valores);
      // Solo se limpia al crear: tras editar, el hook cierra el modo edición y
      // el efecto de abajo devuelve el formulario a los valores iniciales.
      if (!editando) formulario.reiniciar();
    },
  });

  // Al pulsar editar en una fila, el formulario se rellena con sus datos; al
  // cancelar, vuelve a vacío.
  useEffect(() => {
    formulario.reiniciar(filaEditando ? config.aFormulario(filaEditando) : config.valoresIniciales);
    // Se depende de la fila, no del objeto formulario (que cambia cada render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filaEditando]);

  // Al editar se ocultan los campos que solo existen al crear (`clave` en
  // usuarios, `stock` en productos: el PUT del backend no los toca).
  const campos = config.campos.filter((campo) => !(editando && campo.soloEnCrear));

  return (
    <Tarjeta>
      <CabeceraTarjeta titulo={editando ? `Editar ${config.entidad}` : `Registrar ${config.entidad}`} />

      <form onSubmit={formulario.enviar} noValidate>
        {agruparEnFilas(campos).map((grupo, indice) =>
          grupo.length === 1 ? (
            <CampoDinamico
              key={grupo[0].name}
              campo={grupo[0]}
              formulario={formulario}
            />
          ) : (
            <div key={`fila-${indice}`} className="fila-campos">
              {grupo.map((campo) => (
                <CampoDinamico key={campo.name} campo={campo} formulario={formulario} />
              ))}
            </div>
          )
        )}

        <div className="mt-2 flex gap-2.5">
          <Boton
            type="button"
            variante="neutro"
            className="flex-1"
            onClick={() => {
              formulario.reiniciar(config.valoresIniciales);
              onCancelar();
            }}
          >
            {editando ? "Cancelar" : "Limpiar"}
          </Boton>
          <Boton type="submit" variante="acento" className="flex-1" cargando={guardando}>
            Guardar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

type Formulario<TForm extends Record<string, unknown>> = ReturnType<typeof useFormulario<TForm>>;

function CampoDinamico<TForm extends Record<string, unknown>>({
  campo,
  formulario,
}: {
  campo: CampoCrud<TForm>;
  formulario: Formulario<TForm>;
}) {
  const nombre = campo.name;
  const valor = formulario.valores[nombre];
  const error = formulario.errores[nombre];
  const id = `crud-${nombre}`;

  const comunes = {
    id,
    etiqueta: campo.label,
    error,
    ayuda: campo.ayuda,
    onBlur: () => formulario.marcarTocado(nombre),
  };

  if (campo.tipo === "select") {
    return (
      <Selector
        {...comunes}
        opciones={campo.opciones ?? []}
        placeholder={campo.vacio}
        value={(valor as string | number | undefined) ?? ""}
        onChange={(evento) => {
          const crudo = evento.target.value;
          // Un select con opciones numéricas debe entregar números, o el
          // esquema zod rechazaría el string.
          const esNumerico = campo.opciones?.some((opcion) => typeof opcion.valor === "number");
          const convertido = crudo === "" ? null : esNumerico ? Number(crudo) : crudo;
          formulario.cambiar(nombre, convertido as TForm[typeof nombre]);
        }}
      />
    );
  }

  if (campo.tipo === "casilla") {
    return (
      <Casilla
        {...comunes}
        checked={Boolean(valor)}
        onChange={(evento) =>
          formulario.cambiar(nombre, evento.target.checked as TForm[typeof nombre])
        }
      />
    );
  }

  if (campo.tipo === "areatexto") {
    return (
      <AreaTexto
        {...comunes}
        rows={3}
        placeholder={campo.placeholder}
        value={(valor as string | undefined) ?? ""}
        onChange={(evento) =>
          formulario.cambiar(nombre, evento.target.value as TForm[typeof nombre])
        }
      />
    );
  }

  return (
    <CampoTexto
      {...comunes}
      type={TIPO_HTML[campo.tipo] ?? "text"}
      placeholder={campo.placeholder}
      min={campo.min}
      max={campo.max}
      step={campo.paso}
      value={(valor as string | number | undefined) ?? ""}
      onChange={(evento) =>
        formulario.cambiar(nombre, evento.target.value as TForm[typeof nombre])
      }
    />
  );
}

/** Junta los campos marcados como "mitad" en filas de dos columnas. */
function agruparEnFilas<TForm>(campos: CampoCrud<TForm>[]): CampoCrud<TForm>[][] {
  const filas: CampoCrud<TForm>[][] = [];
  let pendiente: CampoCrud<TForm> | null = null;

  for (const campo of campos) {
    if (campo.ancho === "mitad") {
      if (pendiente) {
        filas.push([pendiente, campo]);
        pendiente = null;
      } else {
        pendiente = campo;
      }
      continue;
    }

    // Un campo de ancho completo cierra cualquier mitad suelta.
    if (pendiente) {
      filas.push([pendiente]);
      pendiente = null;
    }
    filas.push([campo]);
  }

  if (pendiente) filas.push([pendiente]);
  return filas;
}
