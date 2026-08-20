"use client";

import { mensajeDeError } from "@/shared/api/errores";
import { MensajeError } from "@/shared/components/ui/estados";
import { cn } from "@/shared/lib/cn";
import type { ConfigCrud } from "./crud.types";
import { FormularioCrud } from "./FormularioCrud";
import { TablaCrud } from "./TablaCrud";
import { useCrud } from "./useCrud";

/**
 * Módulo CRUD completo: formulario a la izquierda, lista a la derecha.
 *
 * Mismo layout `340px | 1fr` del guía, que colapsa a una columna bajo 900px.
 * Las cinco entidades del panel (usuarios, clientes, proveedores, categorías,
 * productos) se resuelven con solo un objeto de configuración.
 */
export function ModuloCrud<TRow, TForm extends Record<string, unknown>>({
  config,
}: {
  config: ConfigCrud<TRow, TForm>;
}) {
  const crud = useCrud(config);
  const conFormulario = (config.puedeCrear ?? true) || (config.puedeEditar ?? true);

  return (
    <div>
      <h1 className="mb-5 text-[1.5rem] font-semibold text-texto">
        Gestión de {config.entidadPlural}
      </h1>

      {crud.error && (
        <div className="mb-5">
          <MensajeError
            mensaje={mensajeDeError(crud.error)}
            onReintentar={() => void crud.recargar()}
          />
        </div>
      )}

      {/* Sin permiso de escritura no se muestra el formulario, y la lista pasa
          a ocupar todo el ancho en lugar de dejar una columna vacía. */}
      <div
        className={cn(
          "grid items-start gap-5",
          conFormulario && "panel:grid-cols-[340px_1fr]"
        )}
      >
        {conFormulario && (
          <FormularioCrud
            config={config}
            filaEditando={crud.filaEditando}
            guardando={crud.guardando}
            onGuardar={crud.guardar}
            onCancelar={crud.cancelarEdicion}
          />
        )}

        <TablaCrud config={config} crud={crud} />
      </div>
    </div>
  );
}
