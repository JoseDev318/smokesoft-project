import { notFound } from "next/navigation";

import { GuardiaSesion } from "@/modules/auth/components/GuardiaSesion";
import { VistaConfirmacion } from "@/modules/carrito/views/VistaConfirmacion";

export default async function Pagina({ params }: { params: Promise<{ idVenta: string }> }) {
  const { idVenta } = await params;
  if (!/^\d+$/.test(idVenta)) notFound();

  return (
    <GuardiaSesion rolesPermitidos={["Cliente"]}>
      <VistaConfirmacion idVenta={Number(idVenta)} />
    </GuardiaSesion>
  );
}
