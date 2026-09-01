import { cookies } from "next/headers";

export type UsuarioToken = {
  id: number;
  nombre: string;
  rol: string;
};

export async function obtenerUsuarioActual(): Promise<UsuarioToken | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    // Un JWT es header.payload.firma — solo decodificamos el payload (parte 2)
    const payloadBase64 = token.split(".")[1];
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
    return JSON.parse(payloadJson) as UsuarioToken;
  } catch {
    return null;
  }
}