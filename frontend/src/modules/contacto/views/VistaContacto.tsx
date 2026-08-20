"use client";

import { z } from "zod";

import { Boton } from "@/shared/components/ui/Boton";
import { AreaTexto, CampoTexto } from "@/shared/components/ui/Campo";
import { CONTACTO } from "@/shared/constants/config";
import { useFormulario } from "@/shared/hooks/useFormulario";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";

const esquema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre").max(150, "Máximo 150 caracteres"),
  correo: z.string().trim().min(1, "Escribe tu correo").email("Escribe un correo válido"),
  asunto: z.string().trim().min(1, "Escribe el motivo del contacto").max(150, "Máximo 150 caracteres"),
  mensaje: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)"),
});

type FormularioContacto = z.infer<typeof esquema>;

const DATOS = [
  { icono: "📞", titulo: "Teléfono", lineas: [CONTACTO.telefono] },
  { icono: "✉️", titulo: "Email", lineas: [CONTACTO.correo] },
  { icono: "🕐", titulo: "Horario de Atención", lineas: [...CONTACTO.horario] },
  { icono: "📍", titulo: "Ubicación", lineas: [CONTACTO.ubicacion] },
];

/**
 * Contacto. Réplica de contactenos.html.
 *
 * TODO: el backend no tiene endpoint de contacto. Cuando exista
 * (POST /api/contacto siguiendo el patrón de los demás módulos), reemplazar el
 * envío simulado de abajo. Por ahora se valida y se confirma en la interfaz,
 * igual que el guía, pero sin el `alert()` bloqueante.
 */
export function VistaContacto() {
  const avisos = useAvisos();

  const formulario = useFormulario<FormularioContacto>({
    valoresIniciales: { nombre: "", correo: "", asunto: "", mensaje: "" },
    esquema,
    alEnviar: async (valores) => {
      avisos.exito(`¡Gracias ${valores.nombre}! Te contactaremos pronto.`);
      formulario.reiniciar();
    },
  });

  const { valores, errores, cambiar, marcarTocado } = formulario;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-wrap justify-center gap-8 px-5 py-10">
      <div className="w-full max-w-[500px] rounded-tarjeta border-2 border-acento bg-superficie p-6 panel:p-8">
        <h1 className="mb-2.5 text-center text-[1.8rem] font-bold text-acento">Contáctanos</h1>
        <p className="mb-6 text-center text-texto-secundario">
          ¿Tienes preguntas o necesitas ayuda? Envíanos un mensaje.
        </p>

        <form onSubmit={formulario.enviar} noValidate>
          <CampoTexto
            id="c-nombre" etiqueta="Nombre completo" publico
            autoComplete="name" placeholder="Escribe tu nombre"
            value={valores.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            onBlur={() => marcarTocado("nombre")}
            error={errores.nombre}
          />
          <CampoTexto
            id="c-correo" etiqueta="Correo electrónico" type="email" publico
            autoComplete="email" placeholder="ejemplo@correo.com"
            value={valores.correo}
            onChange={(e) => cambiar("correo", e.target.value)}
            onBlur={() => marcarTocado("correo")}
            error={errores.correo}
          />
          <CampoTexto
            id="c-asunto" etiqueta="Asunto" publico
            placeholder="Motivo del contacto"
            value={valores.asunto}
            onChange={(e) => cambiar("asunto", e.target.value)}
            onBlur={() => marcarTocado("asunto")}
            error={errores.asunto}
          />
          <AreaTexto
            id="c-mensaje" etiqueta="Mensaje" publico rows={5}
            placeholder="Escribe tu mensaje aquí..."
            value={valores.mensaje}
            onChange={(e) => cambiar("mensaje", e.target.value)}
            onBlur={() => marcarTocado("mensaje")}
            error={errores.mensaje}
          />

          <Boton type="submit" variante="acento" publico cargando={formulario.enviando}>
            Enviar Mensaje
          </Boton>
        </form>
      </div>

      {/* border-l-4 cian: el otro motivo visual del guía, en paneles de info */}
      <aside className="w-full max-w-[350px] rounded-tarjeta border-l-4 border-l-acento bg-superficie p-6 panel:p-8">
        <h2 className="mb-6 text-[1.3rem] font-bold text-acento">Información de Contacto</h2>

        {DATOS.map((dato, indice) => (
          <div
            key={dato.titulo}
            className={
              indice === DATOS.length - 1
                ? "flex items-start gap-4"
                : "mb-5 flex items-start gap-4 border-b border-borde pb-4"
            }
          >
            <span className="text-[1.5rem]" aria-hidden="true">{dato.icono}</span>
            <div>
              <strong className="mb-1 block text-texto">{dato.titulo}</strong>
              {dato.lineas.map((linea) => (
                <p key={linea} className="text-[0.9rem] text-texto-secundario">{linea}</p>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
