import Image from "next/image";
import Link from "next/link";

import { CONFIG } from "@/shared/constants/config";
import { RUTAS } from "@/shared/constants/rutas";

/**
 * Portada. Réplica del hero de index.html.
 *
 * Dos correcciones al guía: el título va en blanco (su hoja de estilos tenía
 * `.titulo-empresa{color:#000}`, pero era código muerto — el HTML usaba una
 * clase inline en blanco), y el CTA es la pastilla de 30px con el resplandor
 * cian, unificando las dos versiones en conflicto que tenía el guía.
 */
export function VistaInicio() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-5 py-14 text-center">
      <Image
        src="/img/logo-smokesoft.png"
        alt=""
        width={200}
        height={200}
        className="mb-5 w-[140px] panel:w-[200px]"
        priority
      />

      <h1 className="mb-2.5 text-[2.2rem] font-bold tracking-[5px] text-texto panel:text-hero">
        {CONFIG.nombreApp.toUpperCase()}
      </h1>

      <p className="mb-8 text-base text-texto panel:text-[1.2rem]">
        Control inteligente para una gestión eficiente
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={RUTAS.productos} className="btn btn-pastilla">
          Ver productos
        </Link>
        <Link
          href={RUTAS.ingresar}
          className="text-[0.95rem] font-semibold text-texto underline decoration-acento decoration-2 underline-offset-4 transition-colors hover:text-acento"
        >
          Ingresar al sistema
        </Link>
      </div>
    </section>
  );
}
