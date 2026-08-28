import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const actualizado = await fetchBackend(`/usuarios/${id}/clave`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(actualizado);
  } catch {
    return NextResponse.json(
      { error: "No se pudo cambiar la contraseña" },
      { status: 500 }
    );
  }
}