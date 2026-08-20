"use client";

import { useEffect, useRef } from "react";

import { Boton } from "./Boton";

/**
 * Diálogo de confirmación. Sustituye el `window.confirm()` del guía, que no se
 * puede estilar y bloquea el hilo.
 *
 * Usa <dialog> nativo: trae el foco atrapado, el cierre con Escape y el
 * backdrop sin necesidad de implementarlos a mano.
 */
export function DialogoConfirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Eliminar",
  onConfirmar,
  onCancelar,
  procesando = false,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  procesando?: boolean;
}) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={referencia}
      // El Escape del <dialog> cierra sin avisar a React: hay que sincronizar.
      onCancel={(evento) => { evento.preventDefault(); onCancelar(); }}
      className="max-w-[min(26rem,calc(100vw-2rem))] rounded-tarjeta border border-borde-suave bg-superficie p-6 text-texto backdrop:bg-black/60"
    >
      <h2 className="mb-2 text-[1.1rem] font-semibold text-texto">{titulo}</h2>
      <p className="mb-6 text-sm text-texto-secundario">{mensaje}</p>

      <div className="flex justify-end gap-2.5">
        <Boton variante="neutro" onClick={onCancelar} disabled={procesando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar} cargando={procesando}>
          {textoConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}
