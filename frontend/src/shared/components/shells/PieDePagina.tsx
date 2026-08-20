import { CONFIG } from "@/shared/constants/config";

/**
 * Pie del shell público. El guía tenía dos clases con opacidades distintas
 * (.footer con 0.6 y .pie-pagina con 0.8); aquí se estandariza en 0.8.
 */
export function PieDePagina() {
  return (
    <footer className="bg-velo-pie px-5 py-5 text-center text-sm text-texto">
      <p>
        © {new Date().getFullYear()} {CONFIG.nombreApp} — Todos los derechos reservados
      </p>
    </footer>
  );
}
