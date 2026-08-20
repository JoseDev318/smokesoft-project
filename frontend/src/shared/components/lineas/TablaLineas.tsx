"use client";

import { formatearMoneda } from "@/shared/lib/dinero";
import type { ProductoFila } from "@/shared/types/bd.types";
import { lineaVacia, type LineaEditable, type ModoLineas } from "./lineas.types";

/**
 * Tabla de líneas editables, compartida por los formularios de venta y compra.
 *
 * Generalizada del `comprasModule.js` del guía y parametrizada por `modo`:
 *  - venta:  el precio sale del producto (solo lectura) y se valida el stock.
 *  - compra: el costo unitario es editable y no se valida stock (una compra
 *            solo puede aumentarlo).
 */
export function TablaLineas({
  modo,
  lineas,
  productos,
  onCambiar,
  deshabilitado = false,
}: {
  modo: ModoLineas;
  lineas: LineaEditable[];
  productos: ProductoFila[];
  onCambiar: (lineas: LineaEditable[]) => void;
  deshabilitado?: boolean;
}) {
  const porId = new Map(productos.map((producto) => [producto.id_producto, producto]));

  function actualizar(indice: number, cambios: Partial<LineaEditable>) {
    onCambiar(
      lineas.map((linea, i) => (i === indice ? { ...linea, ...cambios } : linea))
    );
  }

  function elegirProducto(indice: number, valor: string) {
    if (valor === "") {
      actualizar(indice, { id_producto: "", precio_unitario: 0 });
      return;
    }

    const id = Number(valor);
    const producto = porId.get(id);

    actualizar(indice, {
      id_producto: id,
      // En una venta el precio se toma del catálogo; en una compra se deja lo
      // que ya hubiera escrito el usuario (es el costo del proveedor).
      precio_unitario:
        modo === "venta"
          ? Number(producto?.precio ?? 0)
          : lineas[indice].precio_unitario,
    });
  }

  function quitar(indice: number) {
    const restantes = lineas.filter((_, i) => i !== indice);
    // Siempre queda al menos una fila, para que no haya que pulsar "agregar"
    // después de vaciar la tabla.
    onCambiar(restantes.length ? restantes : [lineaVacia()]);
  }

  return (
    <div>
      <div className="mb-2.5 overflow-x-auto">
        <table className="tabla-lineas">
          <thead>
            <tr>
              <th className="w-[45%]">Producto</th>
              <th className="w-[15%]">Cant.</th>
              <th className="w-[18%]">{modo === "venta" ? "Precio" : "Costo unit."}</th>
              <th className="w-[18%] text-right">Subtotal</th>
              <th className="w-[4%]" />
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea, indice) => {
              const producto = linea.id_producto === "" ? null : porId.get(linea.id_producto);
              const stockDisponible = producto?.stock ?? 0;
              const excedeStock =
                modo === "venta" && producto !== null && linea.cantidad > stockDisponible;
              const subtotal = Math.round(linea.precio_unitario * linea.cantidad);

              return (
                <tr key={indice}>
                  <td>
                    <select
                      value={linea.id_producto}
                      onChange={(evento) => elegirProducto(indice, evento.target.value)}
                      disabled={deshabilitado}
                      aria-label={`Producto de la línea ${indice + 1}`}
                    >
                      <option value="">Producto…</option>
                      {productos.map((opcion) => (
                        <option key={opcion.id_producto} value={opcion.id_producto}>
                          {opcion.nombre}
                          {modo === "venta" ? ` (${opcion.stock} disp.)` : ""}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="number"
                      min={1}
                      // En una venta el tope es el stock real: el backend
                      // respondería 409 y es mejor no dejar llegar ahí.
                      max={modo === "venta" && producto ? stockDisponible : undefined}
                      value={linea.cantidad}
                      onChange={(evento) => {
                        const valor = Math.trunc(Number(evento.target.value));
                        actualizar(indice, { cantidad: Number.isFinite(valor) && valor > 0 ? valor : 1 });
                      }}
                      disabled={deshabilitado}
                      aria-invalid={excedeStock || undefined}
                      aria-label={`Cantidad de la línea ${indice + 1}`}
                      className={excedeStock ? "border-peligro!" : undefined}
                    />
                  </td>

                  <td>
                    {modo === "venta" ? (
                      // Solo lectura: el backend calcula con su propio precio.
                      <span className="whitespace-nowrap">
                        {formatearMoneda(linea.precio_unitario)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={linea.precio_unitario || ""}
                        onChange={(evento) =>
                          actualizar(indice, { precio_unitario: Number(evento.target.value) || 0 })
                        }
                        disabled={deshabilitado}
                        aria-label={`Costo unitario de la línea ${indice + 1}`}
                      />
                    )}
                  </td>

                  <td className="whitespace-nowrap text-right">{formatearMoneda(subtotal)}</td>

                  <td>
                    <button
                      type="button"
                      className="btn-accion btn-accion-eliminar"
                      onClick={() => quitar(indice)}
                      disabled={deshabilitado}
                      aria-label={`Quitar la línea ${indice + 1}`}
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aviso agregado de stock: más claro que solo pintar el input en rojo. */}
      {modo === "venta" && (
        <AvisoStock lineas={lineas} porId={porId} />
      )}

      <button
        type="button"
        className="btn btn-fantasma mb-3.5 w-full"
        onClick={() => onCambiar([...lineas, lineaVacia()])}
        disabled={deshabilitado}
      >
        + Agregar Producto
      </button>
    </div>
  );
}

function AvisoStock({
  lineas,
  porId,
}: {
  lineas: LineaEditable[];
  porId: Map<number, ProductoFila>;
}) {
  const problemas = lineas
    .map((linea) => {
      if (linea.id_producto === "") return null;
      const producto = porId.get(linea.id_producto);
      if (!producto || linea.cantidad <= producto.stock) return null;
      return `${producto.nombre}: pides ${linea.cantidad} y hay ${producto.stock}`;
    })
    .filter((texto): texto is string => texto !== null);

  if (!problemas.length) return null;

  return (
    <p className="mb-2.5 rounded-admin bg-peligro-tinte px-3 py-2 text-[0.85rem] text-peligro" role="alert">
      Stock insuficiente — {problemas.join(" · ")}
    </p>
  );
}
