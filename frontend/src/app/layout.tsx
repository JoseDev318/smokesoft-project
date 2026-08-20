import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { Proveedores } from "@/shared/providers/Proveedores";
import { CONFIG } from "@/shared/constants/config";
import "@/styles/globals.css";

/**
 * El proyecto guía declaraba `font-family: 'Poppins'` sin importarla nunca, así
 * que hasta ahora caía a sans-serif y el diseño previsto no se veía. Aquí sí se
 * carga. Poppins no es fuente variable: los pesos hay que pedirlos explícitos.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fuente-poppins",
});

export const metadata: Metadata = {
  title: {
    default: `${CONFIG.nombreApp} — Gestión inteligente`,
    template: `%s · ${CONFIG.nombreApp}`,
  },
  description: "Tienda y sistema de gestión de insumos para fumadores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
