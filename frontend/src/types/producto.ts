export type Producto = {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  stock: number;
  stock_minimo: number;
  id_categoria: number | null;
  id_proveedor: number | null;
  activo: boolean;
};

export type Categoria = {
  id_categoria: number;
  nombre: string;
};

export type Proveedor = {
  id_proveedor: number;
  nombre: string;
};