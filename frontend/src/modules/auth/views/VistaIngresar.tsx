"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { mensajeDeError } from "@/shared/api/errores";
import { Boton } from "@/shared/components/ui/Boton";
import { CampoTexto } from "@/shared/components/ui/Campo";
import { RUTAS } from "@/shared/constants/rutas";
import { useFormulario } from "@/shared/hooks/useFormulario";
import { inicioSegunRol, useSesion } from "../context/ProveedorSesion";
import { esquemaLogin, type FormularioLogin } from "../schemas/auth.schemas";

/**
 * Ingreso ÚNICO para todos los roles.
 *
 * El guía tenía dos pantallas de login: registro.html (que aceptaba cualquier
 * cosa) y una sección dentro de admin.html (que comparaba la contraseña contra
 * el literal '12345678' e ignoraba el usuario). Ambas contra un solo endpoint
 * real, así que se consolidan aquí y el destino se decide por el rol que
 * devuelve el backend.
 */
export function VistaIngresar() {
  const { ingresar } = useSesion();
  const router = useRouter();
  const params = useSearchParams();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const siguiente = params.get("siguiente");
  const expirada = params.get("motivo") === "expirada";

  const formulario = useFormulario<FormularioLogin>({
    valoresIniciales: { usuario: "", clave: "" },
    esquema: esquemaLogin,
    alEnviar: async (valores) => {
      setErrorGeneral(null);
      try {
        const usuario = await ingresar(valores);
        // `replace` y no `push`: volver atrás no debe regresar al formulario.
        router.replace(siguiente || inicioSegunRol(usuario.rol));
      } catch (error) {
        setErrorGeneral(mensajeDeError(error));
      }
    },
  });

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      {/* border-2 cian: el motivo visual de las cajas de autenticación del guía */}
      <div className="w-full max-w-[400px] rounded-tarjeta border-2 border-acento bg-superficie p-8 text-center panel:p-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Image
            src="/img/logotitle.jpeg"
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-publico object-contain"
          />
          <Image
            src="/img/rollingTimes.jpeg"
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-publico object-contain"
          />
        </div>

        <h1 className="mb-2.5 text-[1.8rem] font-bold text-acento">Iniciar Sesión</h1>
        <p className="mb-6 text-texto-secundario">Ingresa tus datos para acceder</p>

        {expirada && (
          <p className="mb-5 rounded-publico bg-alerta/20 px-3 py-2.5 text-[0.85rem] text-alerta">
            Tu sesión expiró. Vuelve a ingresar para continuar.
          </p>
        )}

        <form onSubmit={formulario.enviar} noValidate className="text-left">
          <CampoTexto
            id="usuario"
            etiqueta="Usuario"
            publico
            autoComplete="username"
            placeholder="Ingresa tu usuario"
            value={formulario.valores.usuario}
            onChange={(evento) => formulario.cambiar("usuario", evento.target.value)}
            onBlur={() => formulario.marcarTocado("usuario")}
            error={formulario.errores.usuario}
          />

          <CampoTexto
            id="clave"
            etiqueta="Contraseña"
            type="password"
            publico
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            value={formulario.valores.clave}
            onChange={(evento) => formulario.cambiar("clave", evento.target.value)}
            onBlur={() => formulario.marcarTocado("clave")}
            error={formulario.errores.clave}
          />

          {errorGeneral && (
            <p className="mb-4 text-[0.9rem] text-peligro" role="alert">
              {errorGeneral}
            </p>
          )}

          <Boton type="submit" variante="acento" publico cargando={formulario.enviando}>
            Ingresar
          </Boton>
        </form>

        <div className="mt-5 border-t border-borde pt-4">
          <p className="text-[0.9rem] text-texto-secundario">
            ¿No tienes cuenta?{" "}
            <Link href={RUTAS.crearCuenta} className="font-bold text-acento hover:underline">
              Crear Cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
