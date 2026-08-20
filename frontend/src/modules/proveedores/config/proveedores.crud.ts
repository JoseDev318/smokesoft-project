"use client";

import { z } from "zod";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import type { ConfigCrud } from "@/shared/components/crud/crud.types";
import type { ProveedorFila } from "@/shared/types/bd.types";
import { proveedoresService } from "../services/proveedores.service";

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  telefono: z.string().trim().max(20, "Máximo 20 caracteres"),
  // Solo se valida el formato si hay algo escrito: la columna admite NULL.
  correo: z.union([z.literal(""), z.string().trim().email("Correo inválido").max(150)]),
  direccion: z.string().trim().max(200, "Máximo 200 caracteres"),
});

type FormularioProveedor = z.infer<typeof esquema>;

export function useConfigProveedores(): ConfigCrud<ProveedorFila, FormularioProveedor> {
  const { usuario } = useSesion();
  const rol = usuario?.rol;

  return {
    clave: "proveedores",
    entidad: "Proveedor",
    entidadPlural: "Proveedores",

    obtenerId: (fila) => fila.id_proveedor,
    etiquetaFila: (fila) => `el proveedor "${fila.nombre}"`,

    campos: [
      {
        name: "nombre", label: "Nombre del Proveedor", tipo: "texto",
        placeholder: "Ej: Distribuidora La Fuma",
      },
      { name: "telefono", label: "Teléfono", tipo: "tel", placeholder: "3001234567", ancho: "mitad" },
      { name: "correo", label: "Correo", tipo: "correo", placeholder: "contacto@proveedor.com", ancho: "mitad" },
      { name: "direccion", label: "Dirección", tipo: "texto", placeholder: "Zona, ciudad" },
    ],

    columnas: [
      { key: "id_proveedor", label: "ID" },
      { key: "nombre", label: "Proveedor" },
      { key: "correo", label: "Correo" },
      { key: "telefono", label: "Teléfono" },
      { key: "direccion", label: "Dirección" },
    ],

    camposBusqueda: ["nombre", "correo", "telefono", "direccion"],

    esquema,
    valoresIniciales: { nombre: "", telefono: "", correo: "", direccion: "" },
    aFormulario: (fila) => ({
      nombre: fila.nombre,
      telefono: fila.telefono ?? "",
      correo: fila.correo ?? "",
      direccion: fila.direccion ?? "",
    }),
    aDtoCrear: (form) => aDto(form),
    aDtoActualizar: (form) => aDto(form),

    servicio: proveedoresService,

    puedeCrear: puede(rol, "proveedores", "escribir"),
    puedeEditar: puede(rol, "proveedores", "escribir"),
    puedeEliminar: puede(rol, "proveedores", "borrar"),

    clavesAInvalidar: [["productos"]],
  };
}

/** El PUT es reemplazo total: se envían siempre los cuatro campos. */
function aDto(form: FormularioProveedor) {
  return {
    nombre: form.nombre,
    telefono: form.telefono || null,
    correo: form.correo || null,
    direccion: form.direccion || null,
  };
}
