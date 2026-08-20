"use client";

import { z } from "zod";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import type { ConfigCrud } from "@/shared/components/crud/crud.types";
import type { ClienteFila } from "@/shared/types/bd.types";
import { clientesService } from "../services/clientes.service";

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  correo: z.union([z.literal(""), z.string().trim().email("Correo inválido").max(150)]),
  telefono: z.string().trim().max(20, "Máximo 20 caracteres"),
  direccion: z.string().trim().max(200, "Máximo 200 caracteres"),
  tipo_documento: z.union([z.literal(""), z.enum(["CC", "TI", "CE"])]),
  documento: z.string().trim().max(30, "Máximo 30 caracteres"),
});

type FormularioCliente = z.infer<typeof esquema>;

const TIPOS_DOCUMENTO = [
  { valor: "CC", etiqueta: "CC" },
  { valor: "TI", etiqueta: "TI" },
  { valor: "CE", etiqueta: "CE" },
];

export function useConfigClientes(): ConfigCrud<ClienteFila, FormularioCliente> {
  const { usuario } = useSesion();
  const rol = usuario?.rol;

  return {
    clave: "clientes",
    entidad: "Cliente",
    entidadPlural: "Clientes",

    obtenerId: (fila) => fila.id_cliente,
    etiquetaFila: (fila) => `el cliente "${fila.nombre}"`,

    campos: [
      { name: "nombre", label: "Nombre Completo", tipo: "texto", placeholder: "Ej: Juan Pérez" },
      { name: "correo", label: "Correo Electrónico", tipo: "correo", placeholder: "correo@ejemplo.com" },
      { name: "telefono", label: "Teléfono", tipo: "tel", placeholder: "3001234567", ancho: "mitad" },
      {
        name: "tipo_documento", label: "Tipo doc.", tipo: "select",
        opciones: TIPOS_DOCUMENTO, vacio: "—", ancho: "mitad",
      },
      { name: "documento", label: "Documento", tipo: "texto", placeholder: "Número de documento" },
      { name: "direccion", label: "Dirección", tipo: "texto", placeholder: "Calle, ciudad" },
    ],

    columnas: [
      { key: "id_cliente", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "correo", label: "Correo" },
      { key: "telefono", label: "Teléfono" },
      { key: "documento", label: "Documento" },
    ],

    camposBusqueda: ["nombre", "correo", "telefono", "documento"],

    esquema,
    valoresIniciales: {
      nombre: "", correo: "", telefono: "", direccion: "",
      tipo_documento: "", documento: "",
    },
    aFormulario: (fila) => ({
      nombre: fila.nombre,
      correo: fila.correo ?? "",
      telefono: fila.telefono ?? "",
      direccion: fila.direccion ?? "",
      tipo_documento: (fila.tipo_documento ?? "") as FormularioCliente["tipo_documento"],
      documento: fila.documento ?? "",
    }),
    aDtoCrear: (form) => aDto(form),
    aDtoActualizar: (form) => aDto(form),

    servicio: clientesService,

    puedeCrear: puede(rol, "clientes", "escribir"),
    puedeEditar: puede(rol, "clientes", "escribir"),
    puedeEliminar: puede(rol, "clientes", "borrar"),

    // El selector de cliente del formulario de ventas usa esta misma lista.
    clavesAInvalidar: [["ventas", "por-cliente"]],
  };
}

function aDto(form: FormularioCliente) {
  return {
    nombre: form.nombre,
    correo: form.correo || null,
    telefono: form.telefono || null,
    direccion: form.direccion || null,
    tipo_documento: form.tipo_documento || null,
    // `documento` tiene índice único: la cadena vacía debe ir como NULL, porque
    // en Postgres los NULL múltiples sí se permiten pero los "" chocarían.
    documento: form.documento || null,
  };
}
