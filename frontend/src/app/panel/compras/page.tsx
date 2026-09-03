import { fetchBackend } from "@/lib/backend";
import ComprasClient from "./ComprasClient";
import type { Compra } from "@/types/compra";
import type { Proveedor } from "@/types/proveedor";
import type { Producto } from "@/types/producto";

export default async function ComprasPage() {
  const [compras, proveedores, productos]: [Compra[], Proveedor[], Producto[]] =
    await Promise.all([
      fetchBackend("/compras"),
      fetchBackend("/proveedores"),
      fetchBackend("/productos"),
    ]);

  return (
    <ComprasClient compras={compras} proveedores={proveedores} productos={productos} />
  );
}