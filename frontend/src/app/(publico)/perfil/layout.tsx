import { GuardiaSesion } from "@/modules/auth/components/GuardiaSesion";

/**
 * La zona de cliente comparte el shell público (fondo de humo, barra superior)
 * pero exige rol 'Cliente'. Es exactamente para lo que sirven los layouts
 * anidados: mismo marco, distinta exigencia de sesión.
 */
export default function LayoutPerfil({ children }: { children: React.ReactNode }) {
  return <GuardiaSesion rolesPermitidos={["Cliente"]}>{children}</GuardiaSesion>;
}
