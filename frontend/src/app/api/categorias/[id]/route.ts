import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const actualizada = await fetchBackend(`/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return NextResponse.json(actualizada);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar la categoría" },
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
    await fetchBackend(`/categorias/${id}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar la categoría" },
      { status: 500 }
    );
  }
}