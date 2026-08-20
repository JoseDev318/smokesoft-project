import { Boton } from "@/shared/components/ui/Boton";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { TejaDato } from "@/shared/components/ui/TejaDato";
import { Insignia } from "@/shared/components/ui/estados";
import { formatearMoneda } from "@/shared/lib/dinero";
import { formatearFecha } from "@/shared/lib/fechas";

/**
 * PÁGINA TEMPORAL DE VERIFICACIÓN (fase 0).
 *
 * Sirve para comparar los tokens lado a lado con smokesoft/css/*.css antes de
 * construir 40 componentes encima. La reemplaza VistaInicio en la fase 2.
 */

const COLORES: { nombre: string; clase: string; valor: string }[] = [
  { nombre: "acento", clase: "bg-acento", valor: "#00e0d1" },
  { nombre: "acento-hover", clase: "bg-acento-hover", valor: "#00b5a8" },
  { nombre: "peligro", clase: "bg-peligro", valor: "#ff4444" },
  { nombre: "info", clase: "bg-info", valor: "#3399ff" },
  { nombre: "exito", clase: "bg-exito", valor: "#2ecc71" },
  { nombre: "alerta", clase: "bg-alerta", valor: "#f5a623" },
  { nombre: "fondo-app", clase: "bg-fondo-app", valor: "#1a1a1a" },
  { nombre: "fondo-lateral", clase: "bg-fondo-lateral", valor: "#111111" },
  { nombre: "superficie", clase: "bg-superficie", valor: "#222222" },
  { nombre: "superficie-alta", clase: "bg-superficie-alta", valor: "#333333" },
  { nombre: "borde", clase: "bg-borde", valor: "#444444" },
  { nombre: "neutro", clase: "bg-neutro", valor: "#555555" },
];

export default function PaginaMuestras() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-acento">Muestras del sistema de diseño</h1>
      <p className="mb-8 text-sm text-texto-apagado">
        Página temporal de verificación. Comparar con smokesoft/css/estilosAdmin.css.
      </p>

      <Seccion titulo="Tipografía (Poppins)">
        <div className="space-y-2">
          <p className="text-hero font-bold tracking-[5px] text-texto">SMOKESOFT</p>
          <p className="text-[1.5rem] text-texto">Título de módulo · 1.5rem</p>
          <p className="text-base text-texto-secundario">Cuerpo secundario · #ccc</p>
          <p className="text-sm text-texto-apagado">Apagado 0.9rem · #aaa</p>
          <p className="text-[0.85rem] text-texto-tenue">Tenue 0.85rem · #888</p>
          <p className="font-medium">Peso 500</p>
          <p className="font-semibold">Peso 600</p>
          <p className="font-bold">Peso 700</p>
        </div>
      </Seccion>

      <Seccion titulo="Colores">
        <div className="grid grid-cols-2 gap-3 movil:grid-cols-3 panel:grid-cols-4">
          {COLORES.map((color) => (
            <div key={color.nombre} className="overflow-hidden rounded-admin border border-borde-suave">
              <div className={`h-14 ${color.clase}`} />
              <div className="bg-superficie px-2.5 py-2">
                <p className="text-xs font-semibold text-texto">{color.nombre}</p>
                <p className="text-xs text-texto-tenue">{color.valor}</p>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Boton variante="acento">Guardar</Boton>
          <Boton variante="neutro">Limpiar</Boton>
          <Boton variante="peligro">Eliminar</Boton>
          <Boton variante="fantasma">+ Agregar Producto</Boton>
          <Boton variante="acento" disabled>Deshabilitado</Boton>
          <a href="#" className="btn btn-pastilla">Ingresar</a>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-accion btn-accion-editar" aria-label="Editar">✎</button>
          <button type="button" className="btn-accion btn-accion-eliminar" aria-label="Eliminar">🗑</button>
          <button type="button" className="btn-accion btn-accion-ver" aria-label="Ver">👁</button>
        </div>
      </Seccion>

      <Seccion titulo="Tejas de estadística">
        <div className="flex flex-wrap gap-4">
          <TejaDato etiqueta="Productos" valor={10} />
          <TejaDato etiqueta="Existencias" valor={655} />
          <TejaDato etiqueta="Ingresos" valor={formatearMoneda("875126.00")} esMoneda />
        </div>
      </Seccion>

      <Seccion titulo="Formulario">
        <Tarjeta className="max-w-sm">
          <CabeceraTarjeta titulo="Registrar Producto" />
          <div className="grupo-campo">
            <label htmlFor="m-nombre">Nombre del Producto</label>
            <input id="m-nombre" type="text" placeholder="Ej: Encendedor Clipper" />
          </div>
          <div className="fila-campos">
            <div className="grupo-campo">
              <label htmlFor="m-precio">Precio</label>
              <input id="m-precio" type="number" placeholder="0" />
            </div>
            <div className="grupo-campo">
              <label htmlFor="m-stock">Stock</label>
              <input id="m-stock" type="number" placeholder="0" />
            </div>
          </div>
          <div className="grupo-campo">
            <label htmlFor="m-cat">Categoría</label>
            <select id="m-cat" defaultValue="">
              <option value="">Seleccionar…</option>
              <option value="1">Encendedores</option>
            </select>
          </div>
          <div className="grupo-campo">
            <label htmlFor="m-error">Campo con error</label>
            <input id="m-error" type="text" aria-invalid="true" defaultValue="" />
            <span className="error-campo">El nombre es obligatorio.</span>
          </div>
          <div className="mt-2 flex gap-2.5">
            <Boton variante="neutro" className="flex-1">Limpiar</Boton>
            <Boton variante="acento" className="flex-1">Guardar</Boton>
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Tabla">
        <Tarjeta>
          <div className="contenedor-tabla">
            <table className="tabla-modulo">
              <thead>
                <tr>
                  <th>ID</th><th>Producto</th><th>Categoría</th>
                  <th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Encendedor Clipper</td>
                  <td>Encendedores</td>
                  <td>{formatearMoneda("7800.00")}</td>
                  <td>45</td>
                  <td><Insignia tono="exito">Activo</Insignia></td>
                  <td className="celda-acciones">
                    <button type="button" className="btn-accion btn-accion-editar" aria-label="Editar">✎</button>
                    <button type="button" className="btn-accion btn-accion-eliminar" aria-label="Eliminar">🗑</button>
                  </td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Bong GRAV Labs</td>
                  <td>Pipas de Vidrio</td>
                  <td>{formatearMoneda("350000.00")}</td>
                  <td>2</td>
                  <td><Insignia tono="alerta">Stock bajo</Insignia></td>
                  <td className="celda-acciones">
                    <button type="button" className="btn-accion btn-accion-editar" aria-label="Editar">✎</button>
                    <button type="button" className="btn-accion btn-accion-eliminar" aria-label="Eliminar">🗑</button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} className="celda-vacia">No hay registros</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.85rem] text-texto-tenue">Mostrando 2 de 10 productos</p>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Formatos (las dos trampas del backend)">
        <Tarjeta className="space-y-2 text-sm">
          <p className="text-texto-secundario">
            Decimal como string <code className="text-acento">&quot;7800.00&quot;</code> →{" "}
            <strong className="text-texto">{formatearMoneda("7800.00")}</strong>
          </p>
          <p className="text-texto-secundario">
            Suma de <code className="text-acento">&quot;7800.00&quot;</code> +{" "}
            <code className="text-acento">&quot;10000.00&quot;</code> →{" "}
            <strong className="text-texto">{formatearMoneda(7800 + 10000)}</strong>{" "}
            <span className="text-texto-tenue">(sin aNumero() concatenaría)</span>
          </p>
          <p className="text-texto-secundario">
            Fecha UTC <code className="text-acento">&quot;2025-12-11T00:00:00.000Z&quot;</code> →{" "}
            <strong className="text-texto">{formatearFecha("2025-12-11T00:00:00.000Z")}</strong>{" "}
            <span className="text-texto-tenue">(debe decir 11, no 10)</span>
          </p>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Tarjeta de producto (única superficie clara)">
        <div className="flex flex-wrap gap-6">
          <article className="tarjeta-producto">
            <span className="etiqueta-producto etiqueta-producto--oferta">OFERTA</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/productos/encendedor-cliper.webp" alt="Encendedor Clipper" />
            <h3 className="tarjeta-producto__nombre">Encendedor Clipper</h3>
            <p className="tarjeta-producto__categoria">Encendedores</p>
            <p>
              <span className="tarjeta-producto__precio-anterior">{formatearMoneda(9000)}</span>
              <span className="tarjeta-producto__precio">{formatearMoneda(7800)}</span>
            </p>
            <p className="tarjeta-producto__existencias">Existencias: 45 unidades</p>
            <div className="tarjeta-producto__pie">
              <Boton variante="acento" publico>Agregar al carrito</Boton>
            </div>
          </article>

          <article className="tarjeta-producto">
            <span className="etiqueta-producto etiqueta-producto--nuevo">NUEVO</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/productos/pipa-bate-gold.webp" alt="Pipa Bate Gold" />
            <h3 className="tarjeta-producto__nombre">Pipa Bate Gold</h3>
            <p className="tarjeta-producto__categoria">Pipas</p>
            <p><span className="tarjeta-producto__precio">{formatearMoneda(12000)}</span></p>
            <p className="tarjeta-producto__existencias">Existencias: 23 unidades</p>
            <div className="tarjeta-producto__pie">
              <Boton variante="acento" publico>Agregar al carrito</Boton>
            </div>
          </article>
        </div>
      </Seccion>

      <Seccion titulo="Fondo de humo (shell público)">
        <div className="fondo-humo flex h-48 flex-col overflow-hidden rounded-tarjeta">
          <div className="flex items-center justify-between bg-velo-barra px-10 py-4">
            <span className="text-[1.8rem] font-bold text-texto">SmokeSoft</span>
            <nav className="flex gap-6 text-sm font-medium">
              <span className="text-acento">Inicio</span>
              <span className="text-texto">Productos</span>
              <span className="text-texto">Contáctenos</span>
            </nav>
          </div>
          <div className="flex-1" />
          <p className="bg-velo-pie py-4 text-center text-sm text-texto">
            © 2026 SmokeSoft — Todos los derechos reservados
          </p>
        </div>
      </Seccion>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b border-borde-suave pb-2 text-lg font-semibold text-texto">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
