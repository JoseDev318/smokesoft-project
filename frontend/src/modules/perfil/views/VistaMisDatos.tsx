"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { clientesService } from "@/modules/clientes/services/clientes.service";
import { mensajeDeError } from "@/shared/api/errores";
import { Boton } from "@/shared/components/ui/Boton";
import { CampoTexto, Selector } from "@/shared/components/ui/Campo";
import { CabeceraTarjeta, Tarjeta } from "@/shared/components/ui/Tarjeta";
import { Cargando, MensajeError } from "@/shared/components/ui/estados";
import { RUTAS } from "@/shared/constants/rutas";
import { useFormulario } from "@/shared/hooks/useFormulario";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  correo: z.union([z.literal(""), z.string().trim().email("Correo inválido").max(150)]),
  telefono: z.string().trim().max(20, "Máximo 20 caracteres"),
  direccion: z.string().trim().max(200, "Máximo 200 caracteres"),
  tipo_documento: z.union([z.literal(""), z.enum(["CC", "TI", "CE"])]),
  documento: z.string().trim().max(30, "Máximo 30 caracteres"),
});

type FormularioDatos = z.infer<typeof esquema>;

const TIPOS = [
  { valor: "CC", etiqueta: "Cédula de Ciudadanía" },
  { valor: "TI", etiqueta: "Tarjeta de Identidad" },
  { valor: "CE", etiqueta: "Cédula de Extranjería" },
];

const VACIO: FormularioDatos = {
  nombre: "", correo: "", telefono: "", direccion: "", tipo_documento: "", documento: "",
};

/**
 * Autogestión de datos del cliente. Reemplaza el `href="#"` de "Editar Perfil".
 *
 * Escribe contra PUT /api/clientes/mio, donde el id sale del token: una cuenta
 * no puede modificar la ficha de otra.
 */
export function VistaMisDatos() {
  const avisos = useAvisos();
  const clienteQuery = useQueryClient();

  const ficha = useQuery({ queryKey: ["clientes", "mio"], queryFn: clientesService.miFicha });

  const guardar = useMutation({
    // PUT de reemplazo total: se envían siempre todos los campos, o el backend
    // escribiría NULL en los omitidos.
    mutationFn: (valores: FormularioDatos) =>
      clientesService.actualizarMiFicha({
        nombre: valores.nombre,
        correo: valores.correo || null,
        telefono: valores.telefono || null,
        direccion: valores.direccion || null,
        tipo_documento: valores.tipo_documento || null,
        documento: valores.documento || null,
      }),
    onSuccess: () => {
      avisos.exito("Tus datos quedaron actualizados");
      void clienteQuery.invalidateQueries({ queryKey: ["clientes", "mio"] });
    },
    onError: (error) => avisos.error(mensajeDeError(error)),
  });

  const formulario = useFormulario<FormularioDatos>({
    valoresIniciales: VACIO,
    esquema,
    alEnviar: async (valores) => { await guardar.mutateAsync(valores); },
  });

  // Cuando llegan los datos del servidor se rellena el formulario.
  useEffect(() => {
    if (!ficha.data) return;
    formulario.reiniciar({
      nombre: ficha.data.nombre,
      correo: ficha.data.correo ?? "",
      telefono: ficha.data.telefono ?? "",
      direccion: ficha.data.direccion ?? "",
      tipo_documento: (ficha.data.tipo_documento ?? "") as FormularioDatos["tipo_documento"],
      documento: ficha.data.documento ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha.data]);

  const { valores, errores, cambiar, marcarTocado } = formulario;

  return (
    <div className="mx-auto w-[90%] max-w-[640px] px-5 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.8rem] font-bold text-acento">Mis datos</h1>
        <Link href={RUTAS.perfil} className="btn btn-neutro">Volver al perfil</Link>
      </div>

      <Tarjeta>
        <CabeceraTarjeta titulo="Datos personales" />

        {ficha.isLoading ? (
          <Cargando />
        ) : ficha.error ? (
          <MensajeError
            mensaje={mensajeDeError(ficha.error)}
            onReintentar={() => void ficha.refetch()}
          />
        ) : (
          <form onSubmit={formulario.enviar} noValidate>
            <CampoTexto
              id="mis-nombre" etiqueta="Nombre completo"
              value={valores.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              onBlur={() => marcarTocado("nombre")}
              error={errores.nombre}
            />
            <CampoTexto
              id="mis-correo" etiqueta="Correo electrónico" type="email"
              value={valores.correo}
              onChange={(e) => cambiar("correo", e.target.value)}
              onBlur={() => marcarTocado("correo")}
              error={errores.correo}
            />
            <div className="fila-campos">
              <CampoTexto
                id="mis-telefono" etiqueta="Teléfono" type="tel"
                value={valores.telefono}
                onChange={(e) => cambiar("telefono", e.target.value)}
                onBlur={() => marcarTocado("telefono")}
                error={errores.telefono}
              />
              <Selector
                id="mis-tipodoc" etiqueta="Tipo de documento"
                opciones={TIPOS} placeholder="—"
                value={valores.tipo_documento}
                onChange={(e) =>
                  cambiar("tipo_documento", e.target.value as FormularioDatos["tipo_documento"])
                }
                error={errores.tipo_documento}
              />
            </div>
            <CampoTexto
              id="mis-documento" etiqueta="Número de documento"
              value={valores.documento}
              onChange={(e) => cambiar("documento", e.target.value)}
              onBlur={() => marcarTocado("documento")}
              error={errores.documento}
            />
            <CampoTexto
              id="mis-direccion" etiqueta="Dirección de entrega"
              placeholder="Calle, ciudad"
              value={valores.direccion}
              onChange={(e) => cambiar("direccion", e.target.value)}
              onBlur={() => marcarTocado("direccion")}
              error={errores.direccion}
              ayuda="La usamos para coordinar tus envíos"
            />

            <Boton type="submit" variante="acento" cargando={guardar.isPending} className="mt-2">
              Guardar cambios
            </Boton>
          </form>
        )}
      </Tarjeta>
    </div>
  );
}
