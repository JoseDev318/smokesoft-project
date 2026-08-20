import { notFound } from "next/navigation";

import { VistaCompraDetalle } from "@/modules/compras/views/VistaCompraDetalle";

// En Next 16 los params de una ruta dinámica son una promesa.
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <VistaCompraDetalle id={Number(id)} />;
}
