import { CONFIG } from "@/shared/constants/config";
import { formatearMoneda } from "@/shared/lib/dinero";

/**
 * Caja de totales (`.resumen-compra` del guía): fondo #333, con el total en
 * cian y separado por un borde superior.
 *
 * El IVA solo aplica a las ventas. Una compra a proveedor no lo lleva: su
 * tratamiento fiscal es otro asunto y la tabla `compra` no tiene dónde
 * guardarlo.
 */
export function ResumenTotales({
  subtotal,
  iva,
  total,
  conIva = true,
}: {
  subtotal: number;
  iva?: number;
  total: number;
  conIva?: boolean;
}) {
  const porcentaje = Math.round(CONFIG.iva * 100);

  return (
    <div className="mb-4 rounded-resumen bg-superficie-alta p-3.5">
      <div className="mb-1.5 flex justify-between text-[0.9rem] text-texto-apagado">
        <span>Subtotal:</span>
        <span>{formatearMoneda(subtotal)}</span>
      </div>

      {conIva && (
        <div className="mb-1.5 flex justify-between text-[0.9rem] text-texto-apagado">
          <span>IVA ({porcentaje}%):</span>
          <span>{formatearMoneda(iva ?? 0)}</span>
        </div>
      )}

      <div className="mt-2 flex justify-between border-t border-borde pt-2 text-[1.2rem] font-bold text-acento">
        <span>Total:</span>
        <span>{formatearMoneda(total)}</span>
      </div>
    </div>
  );
}
