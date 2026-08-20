import { BarraSuperior } from "@/shared/components/shells/BarraSuperior";
import { PieDePagina } from "@/shared/components/shells/PieDePagina";

/**
 * Shell público: la foto de humo fija de fondo, barra traslúcida y pie oscuro.
 *
 * `min-h-dvh` en lugar de `100vh`: arregla el hueco que deja el chrome del
 * navegador móvil, que el guía tenía.
 */
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="fondo-humo flex min-h-dvh flex-col">
      <BarraSuperior />
      <main className="flex flex-1 flex-col">{children}</main>
      <PieDePagina />
    </div>
  );
}
