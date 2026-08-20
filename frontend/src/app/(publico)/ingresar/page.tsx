import { Suspense } from "react";

import { VistaIngresar } from "@/modules/auth/views/VistaIngresar";
import { Cargando } from "@/shared/components/ui/estados";

export const metadata = { title: "Iniciar sesión" };

export default function Pagina() {
  // useSearchParams exige una frontera de Suspense para poder prerenderizar.
  return (
    <Suspense fallback={<Cargando />}>
      <VistaIngresar />
    </Suspense>
  );
}
