"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { mensajeDeError } from "@/shared/api/errores";
import { Boton } from "@/shared/components/ui/Boton";
import { CampoTexto, Selector } from "@/shared/components/ui/Campo";
import { RUTAS } from "@/shared/constants/rutas";
import { useFormulario } from "@/shared/hooks/useFormulario";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import { useSesion } from "../context/ProveedorSesion";
import { esquemaRegistro, type FormularioRegistro } from "../schemas/auth.schemas";

const TIPOS_DOCUMENTO = [
  { valor: "CC", etiqueta: "Cédula de Ciudadanía" },
  { valor: "TI", etiqueta: "Tarjeta de Identidad" },
  { valor: "CE", etiqueta: "Cédula de Extranjería" },
];

/**
 * Alta de cliente. Réplica del formulario a dos columnas de crear-cuenta.html.
 *
 * El backend crea la ficha en `cliente` y la cuenta en `usuario` con
 * rol='Cliente' en una transacción, y devuelve un token: el visitante queda
 * logueado sin pasar por la pantalla de ingreso (el guía solo mostraba un
 * `alert()` y redirigía al login).
 */
export function VistaCrearCuenta() {
  const { registrar } = useSesion();
  const router = useRouter();
  const avisos = useAvisos();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const formulario = useFormulario<FormularioRegistro>({
    valoresIniciales: {
      correo: "", nombre: "", apellidos: "",
      tipo_documento: "CC", documento: "", celular: "", direccion: "",
      usuario: "", clave: "", confirmarClave: "",
    },
    esquema: esquemaRegistro,
    alEnviar: async (valores) => {
      setErrorGeneral(null);
      try {
        // `confirmarClave` es solo del formulario: no se envía.
        await registrar({
          nombre: valores.nombre,
          apellidos: valores.apellidos,
          correo: valores.correo,
          usuario: valores.usuario,
          clave: valores.clave,
          tipo_documento: valores.tipo_documento,
          documento: valores.documento,
          celular: valores.celular,
          direccion: valores.direccion || undefined,
        });
        avisos.exito(`¡Bienvenido, ${valores.nombre}! Tu cuenta está lista.`);
        router.replace(RUTAS.perfil);
      } catch (error) {
        setErrorGeneral(mensajeDeError(error));
      }
    },
  });

  const { valores, errores, cambiar, marcarTocado } = formulario;

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-[700px] rounded-tarjeta border-2 border-acento bg-superficie p-6 text-center panel:p-10">
        <h1 className="mb-2.5 text-[1.8rem] font-bold text-acento">Crear Cuenta</h1>
        <p className="mb-6 text-texto-secundario">Completa el formulario para registrarte</p>

        <form onSubmit={formulario.enviar} noValidate className="grid gap-5 text-left panel:grid-cols-2">
          <div className="flex flex-col">
            <CampoTexto
              id="correo" etiqueta="Correo electrónico" type="email" publico
              autoComplete="email" placeholder="ejemplo@correo.com"
              value={valores.correo}
              onChange={(e) => cambiar("correo", e.target.value)}
              onBlur={() => marcarTocado("correo")}
              error={errores.correo}
            />
            <CampoTexto
              id="nombre" etiqueta="Nombre" publico
              autoComplete="given-name" placeholder="Tu nombre"
              value={valores.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              onBlur={() => marcarTocado("nombre")}
              error={errores.nombre}
            />
            <CampoTexto
              id="apellidos" etiqueta="Apellidos" publico
              autoComplete="family-name" placeholder="Tus apellidos"
              value={valores.apellidos}
              onChange={(e) => cambiar("apellidos", e.target.value)}
              onBlur={() => marcarTocado("apellidos")}
              error={errores.apellidos}
            />
            <Selector
              id="tipo_documento" etiqueta="Tipo de documento" publico
              opciones={TIPOS_DOCUMENTO}
              value={valores.tipo_documento}
              onChange={(e) => cambiar("tipo_documento", e.target.value as FormularioRegistro["tipo_documento"])}
              error={errores.tipo_documento}
            />
          </div>

          <div className="flex flex-col">
            <CampoTexto
              id="documento" etiqueta="Número de documento" publico
              placeholder="Número de documento"
              value={valores.documento}
              onChange={(e) => cambiar("documento", e.target.value)}
              onBlur={() => marcarTocado("documento")}
              error={errores.documento}
            />
            <CampoTexto
              id="celular" etiqueta="Celular" type="tel" publico
              autoComplete="tel" placeholder="+57 300 000 0000"
              value={valores.celular}
              onChange={(e) => cambiar("celular", e.target.value)}
              onBlur={() => marcarTocado("celular")}
              error={errores.celular}
            />
            <CampoTexto
              id="usuario" etiqueta="Nombre de usuario" publico
              autoComplete="username" placeholder="Define tu usuario"
              value={valores.usuario}
              onChange={(e) => cambiar("usuario", e.target.value)}
              onBlur={() => marcarTocado("usuario")}
              error={errores.usuario}
            />
            <CampoTexto
              id="direccion" etiqueta="Dirección (opcional)" publico
              autoComplete="street-address" placeholder="Calle, ciudad"
              value={valores.direccion ?? ""}
              onChange={(e) => cambiar("direccion", e.target.value)}
              onBlur={() => marcarTocado("direccion")}
              error={errores.direccion}
            />
          </div>

          <div className="panel:col-span-2 panel:grid panel:grid-cols-2 panel:gap-5">
            <CampoTexto
              id="clave" etiqueta="Contraseña" type="password" publico
              autoComplete="new-password" placeholder="Mínimo 8 caracteres"
              value={valores.clave}
              onChange={(e) => cambiar("clave", e.target.value)}
              onBlur={() => marcarTocado("clave")}
              error={errores.clave}
              ayuda="Al menos 8 caracteres"
            />
            <CampoTexto
              id="confirmarClave" etiqueta="Confirmar contraseña" type="password" publico
              autoComplete="new-password" placeholder="Repite tu contraseña"
              value={valores.confirmarClave}
              onChange={(e) => cambiar("confirmarClave", e.target.value)}
              onBlur={() => marcarTocado("confirmarClave")}
              error={errores.confirmarClave}
            />
          </div>

          <div className="panel:col-span-2">
            {errorGeneral && (
              <p className="mb-4 text-center text-[0.9rem] text-peligro" role="alert">
                {errorGeneral}
              </p>
            )}

            <Boton type="submit" variante="acento" publico cargando={formulario.enviando}>
              Crear Cuenta
            </Boton>

            <p className="mt-4 text-center text-[0.9rem] text-texto-secundario">
              ¿Ya tienes cuenta?{" "}
              <Link href={RUTAS.ingresar} className="font-bold text-acento hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
