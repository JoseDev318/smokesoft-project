import { fetchBackend } from "@/lib/backend";
import ProveedoresClient from "./ProveedoresClient";
import type { Proveedor } from "@/types/proveedor";

export default async function ProveedoresPage() {
  const proveedores: Proveedor[] = await fetchBackend("/proveedores");

  return <ProveedoresClient proveedores={proveedores} />;
}