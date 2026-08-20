import { GuardiaSesion } from "@/modules/auth/components/GuardiaSesion";
import { VistaCheckout } from "@/modules/carrito/views/VistaCheckout";

export const metadata = { title: "Confirmar pedido" };

// El checkout necesita una ficha de cliente para registrar la venta, así que
// exige rol 'Cliente'. El carrito sobrevive al desvío porque vive en
// localStorage.
export default function Pagina() {
  return (
    <GuardiaSesion rolesPermitidos={["Cliente"]}>
      <VistaCheckout />
    </GuardiaSesion>
  );
}
