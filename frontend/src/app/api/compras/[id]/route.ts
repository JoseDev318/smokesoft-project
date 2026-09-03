import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const compra = await fetchBackend(`/compras/${id}`);
    return NextResponse.json(compra);
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el detalle de la compra" },
      { status: 500 }
    );
  }
}