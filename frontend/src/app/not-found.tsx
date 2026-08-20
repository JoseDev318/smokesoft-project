import Link from "next/link";

import { RUTAS } from "@/shared/constants/rutas";

export default function NoEncontrado() {
  return (
    <div className="fondo-humo flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="text-[4rem] font-bold text-acento">404</p>
      <h1 className="mb-2 text-xl font-semibold text-texto">No encontramos esta página</h1>
      <p className="mb-6 text-sm text-texto-secundario">
        El enlace puede estar roto o el contenido ya no existe.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href={RUTAS.inicio} className="btn btn-acento">
          Ir al inicio
        </Link>
        <Link href={RUTAS.productos} className="btn btn-neutro">
          Ver productos
        </Link>
      </div>
    </div>
  );
}
