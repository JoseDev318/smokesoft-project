import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nueva = await fetchBackend("/categorias", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear la categoría" },
      { status: 500 }
    );
  }
}