import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const actualizado = await fetchBackend(`/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return NextResponse.json(actualizado);
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await fetchBackend(`/clientes/${id}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el cliente" },
      { status: 500 }
    );
  }
}