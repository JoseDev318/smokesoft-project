import { notFound } from "next/navigation";

import { VistaMiPedido } from "@/modules/perfil/views/VistaMiPedido";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <VistaMiPedido id={Number(id)} />;
}
