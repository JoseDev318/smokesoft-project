"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useSesion } from "@/modules/auth/context/ProveedorSesion";
import { puede } from "@/modules/auth/constants/roles";
import { categoriasService } from "@/modules/categorias/services/categorias.service";
import { proveedoresService } from "@/modules/proveedores/services/proveedores.service";
import { mensajeDeError } from "@/shared/api/errores";
import type { ConfigCrud } from "@/shared/components/crud/crud.types";
import { Insignia } from "@/shared/components/ui/estados";

import { useAvisos } from "@/shared/providers/ProveedorAvisos";
import type { ProductoFila } from "@/shared/types/bd.types";
import { productosService } from "../services/productos.service";

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  descripcion: z.string().trim().max(1000, "Máximo 1000 caracteres"),
  // El precio se maneja como texto en el formulario (llega del backend como
  // Decimal string) y se convierte al enviar.
  precio: z
    .string().trim().min(1, "El precio es obligatorio")
    .refine((valor) => Number(valor) > 0, "El precio debe ser mayor que cero")
    // DECIMAL(10,2) topa en 99.999.999,99: pasarse produce un
    // "numeric field overflow" que el backend devuelve como 500.
    .refine((valor) => Number(valor) <= 99_999_999.99, "El precio máximo es 99.999.999,99"),
  stock: z
    .string().trim()
    .refine((valor) => Number.isInteger(Number(valor)) && Number(valor) >= 0,
      "El stock debe ser un entero mayor o igual a cero"),
  stock_minimo: z
    .string().trim()
    .refine((valor) => Number.isInteger(Number(valor)) && Number(valor) >= 0,
      "El stock mínimo debe ser un entero mayor o igual a cero"),
  id_categoria: z.number().int().nullable(),
  id_proveedor: z.number().int().nullable(),
  imagen: z.string().trim().max(255, "Máximo 255 caracteres"),
});

type FormularioProducto = z.infer<typeof esquema>;

export function useConfigProductos(): ConfigCrud<ProductoFila, FormularioProducto> {
  const { usuario } = useSesion();
  const rol = usuario?.rol;
  const clienteQuery = useQueryClient();
  const avisos = useAvisos();

  // El backend devuelve id_categoria/id_proveedor crudos, sin join, así que
  // hace falta traer ambas listas para resolver nombres y llenar los select.
  // La caché de react-query hace que se pidan una sola vez para toda la app.
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.listar,
  });
  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: proveedoresService.listar,
    enabled: puede(rol, "proveedores", "ver"),
  });

  const nombresCategoria = new Map(categorias.map((c) => [c.id_categoria, c.nombre]));
  const nombresProveedor = new Map(proveedores.map((p) => [p.id_proveedor, p.nombre]));

  return {
    clave: "productos",
    entidad: "Producto",
    entidadPlural: "Productos",

    obtenerId: (fila) => fila.id_producto,
    etiquetaFila: (fila) => `el producto "${fila.nombre}"`,

    campos: [
      { name: "nombre", label: "Nombre del Producto", tipo: "texto", placeholder: "Ej: Encendedor Clipper" },
      { name: "descripcion", label: "Descripción", tipo: "areatexto", placeholder: "Descripción opcional" },
      {
        name: "precio", label: "Precio", tipo: "numero", placeholder: "0",
        min: 0, paso: 0.01, ancho: "mitad",
      },
      {
        name: "stock", label: "Stock inicial", tipo: "numero", placeholder: "0",
        min: 0, paso: 1, ancho: "mitad",
        // El PUT del backend NO actualiza `stock`: se mueve por ajuste de
        // inventario o por una venta/compra. Mostrarlo al editar haría creer
        // que se puede corregir desde aquí.
        soloEnCrear: true,
        ayuda: "Después se ajusta desde Inventario",
      },
      {
        name: "stock_minimo", label: "Stock mínimo", tipo: "numero", placeholder: "0",
        min: 0, paso: 1, ancho: "mitad",
      },
      {
        name: "id_categoria", label: "Categoría", tipo: "select", ancho: "mitad",
        vacio: "Sin categoría",
        opciones: categorias.map((c) => ({ valor: c.id_categoria, etiqueta: c.nombre })),
      },
      {
        name: "id_proveedor", label: "Proveedor", tipo: "select",
        vacio: "Sin proveedor",
        opciones: proveedores.map((p) => ({ valor: p.id_proveedor, etiqueta: p.nombre })),
      },
      {
        name: "imagen", label: "Imagen", tipo: "texto", placeholder: "vaper.webp",
        ayuda: "Nombre del archivo en public/img/productos/",
      },
    ],

    columnas: [
      { key: "id_producto", label: "ID" },
      { key: "nombre", label: "Producto" },
      {
        key: "id_categoria", label: "Categoría",
        // Resolución del join que el backend no hace.
        render: (fila) =>
          fila.id_categoria ? nombresCategoria.get(fila.id_categoria) ?? "—" : "—",
      },
      {
        key: "id_proveedor", label: "Proveedor",
        render: (fila) =>
          fila.id_proveedor ? nombresProveedor.get(fila.id_proveedor) ?? "—" : "—",
      },
      { key: "precio", label: "Precio", formato: "moneda", alinear: "der" },
      {
        key: "stock", label: "Stock", alinear: "der",
        render: (fila) => (
          <span className={fila.stock <= fila.stock_minimo ? "font-semibold text-alerta" : undefined}>
            {fila.stock}
          </span>
        ),
      },
      {
        key: "activo", label: "Estado",
        render: (fila) =>
          fila.activo
            ? <Insignia tono="exito">Activo</Insignia>
            : <Insignia tono="neutro">Inactivo</Insignia>,
      },
    ],

    camposBusqueda: ["nombre", "descripcion"],

    esquema,
    valoresIniciales: {
      nombre: "", descripcion: "", precio: "", stock: "0", stock_minimo: "0",
      id_categoria: null, id_proveedor: null, imagen: "",
    },
    aFormulario: (fila) => ({
      nombre: fila.nombre,
      descripcion: fila.descripcion ?? "",
      // Se mantiene como string: es lo que entrega el backend y lo que espera
      // el input.
      precio: fila.precio,
      stock: String(fila.stock),
      stock_minimo: String(fila.stock_minimo),
      id_categoria: fila.id_categoria,
      id_proveedor: fila.id_proveedor,
      imagen: fila.imagen ?? "",
    }),
    aDtoCrear: (form) => ({
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stock_minimo: Number(form.stock_minimo),
      id_categoria: form.id_categoria,
      id_proveedor: form.id_proveedor,
      imagen: form.imagen || null,
    }),
    // Sin `stock`: el PUT no lo actualiza.
    aDtoActualizar: (form) => ({
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: Number(form.precio),
      stock_minimo: Number(form.stock_minimo),
      id_categoria: form.id_categoria,
      id_proveedor: form.id_proveedor,
      imagen: form.imagen || null,
    }),

    servicio: productosService,

    puedeCrear: puede(rol, "productos", "escribir"),
    puedeEditar: puede(rol, "productos", "escribir"),
    puedeEliminar: puede(rol, "productos", "borrar"),

    accionesExtra: [
      {
        icono: "🚫",
        titulo: "Desactivar",
        variante: "eliminar",
        visible: (fila) => fila.activo && puede(rol, "productos", "escribir"),
        confirmar: (fila) =>
          `¿Desactivar "${fila.nombre}"? Dejará de aparecer en la tienda, pero se conserva su historial.`,
        onClick: (fila) => cambiarEstado(fila, false),
      },
      {
        icono: "✔",
        titulo: "Activar",
        variante: "ver",
        visible: (fila) => !fila.activo && puede(rol, "productos", "escribir"),
        onClick: (fila) => cambiarEstado(fila, true),
      },
    ],

    // Guardar un producto mueve las tejas del dashboard y el catálogo público.
    clavesAInvalidar: [
      ["productos", "resumen"],
      ["productos", "stock-bajo"],
      ["catalogo", "productos"],
    ],

    vacio: {
      titulo: "Todavía no hay productos",
      mensaje: "Registra el primero con el formulario de la izquierda.",
    },
  };

  async function cambiarEstado(fila: ProductoFila, activo: boolean) {
    try {
      await productosService.cambiarEstado(fila.id_producto, activo);
      avisos.exito(`"${fila.nombre}" quedó ${activo ? "activo" : "inactivo"}`);
      void clienteQuery.invalidateQueries({ queryKey: ["productos"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo", "productos"] });
    } catch (error) {
      avisos.error(mensajeDeError(error));
    }
  }
}

// Reexportado para el formulario de inventario, que valida el mismo precio.
export { esquema as esquemaProducto };
export type { FormularioProducto };
