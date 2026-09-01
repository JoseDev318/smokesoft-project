import { obtenerUsuarioActual } from "@/lib/auth";
import PanelSidebar from "@/components/PanelSidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuarioActual();

  return (
    <div className="flex min-h-screen">
      <PanelSidebar usuario={usuario} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}