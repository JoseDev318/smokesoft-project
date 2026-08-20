"use client";

import { z } from "zod";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import type { ConfigCrud } from "@/shared/components/crud/crud.types";
import type { CategoriaFila } from "@/shared/types/bd.types";
import { categoriasService } from "../services/categorias.service";

// Los máximos replican los VARCHAR del esquema, para que el error salga aquí y
// no como "value too long for type character varying(100)" desde Postgres.
const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres"),
});

type FormularioCategoria = z.infer<typeof esquema>;

export function useConfigCategorias(): ConfigCrud<CategoriaFila, FormularioCategoria> {
  const { usuario } = useSesion();
  const rol = usuario?.rol;

  return {
    clave: "categorias",
    entidad: "Categoría",
    entidadPlural: "Categorías",
    genero: "f",

    obtenerId: (fila) => fila.id_categoria,
    etiquetaFila: (fila) => `la categoría "${fila.nombre}"`,

    campos: [
      { name: "nombre", label: "Nombre", tipo: "texto", placeholder: "Ej: Encendedores" },
      {
        name: "descripcion", label: "Descripción", tipo: "areatexto",
        placeholder: "Descripción opcional",
      },
    ],

    columnas: [
      { key: "id_categoria", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "descripcion", label: "Descripción" },
    ],

    camposBusqueda: ["nombre", "descripcion"],

    esquema,
    valoresIniciales: { nombre: "", descripcion: "" },
    aFormulario: (fila) => ({
      nombre: fila.nombre,
      descripcion: fila.descripcion ?? "",
    }),
    // Cadena vacía a null: el esquema permite NULL y así no se guardan textos
    // en blanco que luego se muestran como "".
    aDtoCrear: (form) => ({
      nombre: form.nombre,
      descripcion: form.descripcion || null,
    }),
    aDtoActualizar: (form) => ({
      nombre: form.nombre,
      descripcion: form.descripcion || null,
    }),

    servicio: categoriasService,

    puedeCrear: puede(rol, "categorias", "escribir"),
    puedeEditar: puede(rol, "categorias", "escribir"),
    puedeEliminar: puede(rol, "categorias", "borrar"),

    // Los productos muestran el nombre de la categoría resuelto en cliente:
    // renombrarla debe refrescar también esa vista.
    clavesAInvalidar: [["productos"], ["catalogo", "categorias"]],
  };
}
