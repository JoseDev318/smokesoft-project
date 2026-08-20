import { GuardiaSesion } from "@/modules/auth/components/GuardiaSesion";
import { ShellAdmin } from "@/shared/components/shells/ShellAdmin";
import { ROLES_STAFF } from "@/shared/types/bd.types";

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <GuardiaSesion rolesPermitidos={ROLES_STAFF}>
      <ShellAdmin>{children}</ShellAdmin>
    </GuardiaSesion>
  );
}
