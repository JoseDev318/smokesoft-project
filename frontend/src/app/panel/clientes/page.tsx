import { fetchBackend } from "@/lib/backend";
import ClientesClient from "./ClientesClient";
import type { Cliente } from "@/types/cliente";

export default async function ClientesPage() {
  const clientes: Cliente[] = await fetchBackend("/clientes");

  return <ClientesClient clientes={clientes} />;
}