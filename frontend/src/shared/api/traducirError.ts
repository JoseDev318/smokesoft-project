/**
 * Convierte los mensajes crudos de PostgreSQL en español entendible.
 *
 * Hace falta porque el backend original no tiene capa de validación: sus
 * controladores pasan `req.body` directo a `pool.query`, así que un campo
 * obligatorio ausente sale como un 500 con el texto literal de Postgres
 * ("null value in column \"nombre\" violates not-null constraint").
 *
 * Los módulos nuevos (clientes, ventas, compras) sí devuelven 400/404/409 con
 * mensajes propios, y esos pasan tal cual.
 *
 * IMPORTANTE: esto es la RED DE SEGURIDAD, no la defensa principal. La defensa
 * es zod validando en el navegador antes de enviar. Esta tabla solo cubre lo
 * que únicamente el servidor puede saber, como un usuario ya tomado.
 */

/** Nombres de columna en lenguaje humano, para las violaciones de NOT NULL. */
const ETIQUETAS_COLUMNA: Record<string, string> = {
  nombre: "Nombre",
  usuario: "Usuario",
  correo: "Correo",
  clave: "Contraseña",
  rol: "Rol",
  precio: "Precio",
  stock: "Stock",
  stock_minimo: "Stock mínimo",
  cantidad: "Cantidad",
  subtotal: "Subtotal",
  total: "Total",
  precio_unitario: "Precio unitario",
  telefono: "Teléfono",
  direccion: "Dirección",
  documento: "Documento",
  descripcion: "Descripción",
  id_categoria: "Categoría",
  id_proveedor: "Proveedor",
  id_cliente: "Cliente",
  id_producto: "Producto",
};

interface Regla {
  patron: RegExp;
  mensaje: string | ((coincidencia: RegExpExecArray) => string);
}

// El orden importa: las reglas específicas van antes de las genéricas.
const REGLAS: Regla[] = [
  {
    patron: /duplicate key .*"usuario_usuario_key"/i,
    mensaje: "Ese nombre de usuario ya está registrado.",
  },
  {
    patron: /duplicate key .*"usuario_correo_key"/i,
    mensaje: "Ese correo ya está registrado.",
  },
  {
    patron: /duplicate key .*"cliente_correo_key"/i,
    mensaje: "Ya existe un cliente con ese correo.",
  },
  {
    patron: /duplicate key .*"cliente_documento_key"/i,
    mensaje: "Ya existe un cliente con ese documento.",
  },
  {
    patron: /duplicate key/i,
    mensaje: "Ese valor ya existe. Revisa los datos.",
  },
  {
    patron: /null value in column "(\w+)".*not[- ]null/i,
    mensaje: (coincidencia) => {
      const columna = coincidencia[1];
      return `El campo "${ETIQUETAS_COLUMNA[columna] ?? columna}" es obligatorio.`;
    },
  },
  {
    patron: /violates foreign key .*table "producto"/i,
    mensaje: "No se puede eliminar: hay productos asociados.",
  },
  {
    patron: /violates foreign key .*table "detalle_venta"/i,
    mensaje: "No se puede eliminar: el producto tiene ventas registradas.",
  },
  {
    patron: /violates foreign key .*table "detalle_compra"/i,
    mensaje: "No se puede eliminar: el producto tiene compras registradas.",
  },
  {
    patron: /violates foreign key/i,
    mensaje: "No se puede eliminar porque tiene registros relacionados.",
  },
  {
    patron: /invalid input syntax for type (integer|numeric|bigint)/i,
    mensaje: "Hay un valor numérico inválido en el formulario.",
  },
  {
    patron: /value too long .*varying\((\d+)\)/i,
    mensaje: (coincidencia) => `Un texto supera el máximo de ${coincidencia[1]} caracteres.`,
  },
  {
    patron: /numeric field overflow/i,
    mensaje: "El monto es demasiado grande. Revisa cantidades y precios.",
  },
  {
    patron: /invalid input syntax for type date/i,
    mensaje: "La fecha indicada no es válida.",
  },
];

/**
 * Traduce un mensaje del backend. Si no parece un error de Postgres, se devuelve
 * tal cual: los mensajes propios del backend ("Stock insuficiente para X",
 * "Usuario o contraseña incorrectos") ya son buenos.
 */
export function traducirError(mensaje: string | undefined, estado: number): string {
  if (!mensaje) return mensajePorEstado(estado);

  for (const regla of REGLAS) {
    const coincidencia = regla.patron.exec(mensaje);
    if (coincidencia) {
      return typeof regla.mensaje === "function" ? regla.mensaje(coincidencia) : regla.mensaje;
    }
  }

  // Un 500 sin patrón conocido casi siempre es ruido interno: no se muestra.
  if (estado >= 500 && parecePostgres(mensaje)) {
    return "Ocurrió un error inesperado en el servidor. Intenta de nuevo.";
  }

  return mensaje;
}

function parecePostgres(mensaje: string): boolean {
  return /relation|column|constraint|syntax|pg_|postgres|violates/i.test(mensaje);
}

function mensajePorEstado(estado: number): string {
  if (estado === 400) return "Los datos enviados no son válidos.";
  if (estado === 401) return "Debes iniciar sesión.";
  if (estado === 403) return "No tienes permisos para realizar esta acción.";
  if (estado === 404) return "No se encontró lo que buscabas.";
  if (estado === 409) return "La operación entra en conflicto con los datos existentes.";
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
