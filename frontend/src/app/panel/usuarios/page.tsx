import { fetchBackend } from "@/lib/backend";
import UsuariosClient from "./UsuariosClient";
import type { Usuario } from "@/types/usuario";

export default async function UsuariosPage() {
  const usuarios: Usuario[] = await fetchBackend("/usuarios");

  return <UsuariosClient usuarios={usuarios} />;
}