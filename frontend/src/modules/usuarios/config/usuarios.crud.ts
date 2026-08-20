"use client";

import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import { mensajeDeError } from "@/shared/api/errores";
import type { ConfigCrud } from "@/shared/components/crud/crud.types";
import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { Rol, UsuarioFila } from "@/shared/types/bd.types";
import { usuariosService } from "../services/usuarios.service";

/** Los roles que el panel puede asignar. 'Cliente' no está: esas cuentas se
 *  crean solas desde el registro público de la tienda. */
const ROLES_ASIGNABLES = [
  { valor: "Administrador", etiqueta: "Administrador" },
  { valor: "Inventario", etiqueta: "Inventario" },
  { valor: "Vendedor", etiqueta: "Vendedor" },
];

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  usuario: z
    .string().trim()
    .min(4, "Mínimo 4 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo"),
  correo: z.union([z.literal(""), z.string().trim().email("Correo inválido").max(150)]),
  rol: z.enum(["Administrador", "Inventario", "Vendedor"]),
  // El backend exige 8. Se permite vacío porque al EDITAR el campo se oculta y
  // el valor no se envía (no hay endpoint de cambio de clave).
  clave: z.union([z.literal(""), z.string().min(8, "Mínimo 8 caracteres")]),
});

type FormularioUsuario = z.infer<typeof esquema>;

export function useConfigUsuarios(): ConfigCrud<UsuarioFila, FormularioUsuario> {
  const { usuario: sesion } = useSesion();
  const rol = sesion?.rol;
  const clienteQuery = useQueryClient();
  const avisos = useAvisos();

  return {
    clave: "usuarios",
    entidad: "Usuario",
    entidadPlural: "Usuarios",

    obtenerId: (fila) => fila.id_usuario,
    etiquetaFila: (fila) => `el usuario "${fila.usuario}"`,

    campos: [
      { name: "nombre", label: "Nombre Completo", tipo: "texto", placeholder: "Ej: María Vendedora" },
      {
        name: "usuario", label: "Nombre de Usuario", tipo: "texto", placeholder: "usuario123",
        // El PUT del backend no actualiza `usuario`: mostrarlo al editar
        // sugeriría que se puede cambiar cuando no se puede.
        soloEnCrear: true,
      },
      {
        name: "clave", label: "Contraseña", tipo: "clave", placeholder: "Mínimo 8 caracteres",
        // No hay endpoint de cambio de contraseña, así que solo al crear.
        soloEnCrear: true,
        ayuda: "Solo se define al crear la cuenta",
      },
      { name: "correo", label: "Correo Electrónico", tipo: "correo", placeholder: "usuario@smokesoft.com" },
      { name: "rol", label: "Rol", tipo: "select", opciones: ROLES_ASIGNABLES },
    ],

    columnas: [
      { key: "id_usuario", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "usuario", label: "Usuario" },
      { key: "correo", label: "Correo" },
      { key: "rol", label: "Rol" },
      { key: "estado", label: "Estado", formato: "booleano" },
    ],

    camposBusqueda: ["nombre", "usuario", "correo", "rol"],

    esquema,
    valoresIniciales: { nombre: "", usuario: "", correo: "", rol: "Vendedor", clave: "" },
    aFormulario: (fila) => ({
      nombre: fila.nombre,
      usuario: fila.usuario,
      correo: fila.correo ?? "",
      rol: fila.rol as FormularioUsuario["rol"],
      clave: "",
    }),
    aDtoCrear: (form) => ({
      nombre: form.nombre,
      usuario: form.usuario,
      correo: form.correo || null,
      clave: form.clave,
      rol: form.rol as Rol,
    }),
    // El PUT solo acepta estos tres campos: mandar más no haría nada, y mandar
    // menos escribiría NULL.
    aDtoActualizar: (form) => ({
      nombre: form.nombre,
      correo: form.correo || null,
      rol: form.rol as Rol,
    }),

    servicio: usuariosService,

    puedeCrear: puede(rol, "usuarios", "escribir"),
    puedeEditar: puede(rol, "usuarios", "escribir"),
    puedeEliminar: puede(rol, "usuarios", "borrar"),

    // El estado se cambia por PATCH /:id/estado, no por el formulario: el PUT
    // del backend no toca esa columna.
    accionesExtra: [
      {
        icono: "🚫",
        titulo: "Desactivar",
        variante: "eliminar",
        visible: (fila) => fila.estado && puede(rol, "usuarios", "escribir"),
        confirmar: (fila) =>
          `¿Desactivar a ${fila.nombre}? No podrá volver a iniciar sesión, pero su historial se conserva.`,
        onClick: async (fila) => {
          try {
            await usuariosService.cambiarEstado(fila.id_usuario, false);
            avisos.exito(`${fila.nombre} quedó inactivo`);
            void clienteQuery.invalidateQueries({ queryKey: ["usuarios"] });
          } catch (error) {
            avisos.error(mensajeDeError(error));
          }
        },
      },
      {
        icono: "✔",
        titulo: "Activar",
        variante: "ver",
        visible: (fila) => !fila.estado && puede(rol, "usuarios", "escribir"),
        onClick: async (fila) => {
          try {
            await usuariosService.cambiarEstado(fila.id_usuario, true);
            avisos.exito(`${fila.nombre} quedó activo`);
            void clienteQuery.invalidateQueries({ queryKey: ["usuarios"] });
          } catch (error) {
            avisos.error(mensajeDeError(error));
          }
        },
      },
    ],
  };
}
