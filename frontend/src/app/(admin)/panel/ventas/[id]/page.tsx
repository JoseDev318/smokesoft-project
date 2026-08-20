import { notFound } from "next/navigation";

import { VistaVentaDetalle } from "@/modules/ventas/views/VistaVentaDetalle";

// En Next 16 los params de una ruta dinámica son una promesa.
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <VistaVentaDetalle id={Number(id)} />;
}
