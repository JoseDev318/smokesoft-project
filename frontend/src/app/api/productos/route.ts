import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nuevo = await fetchBackend("/productos", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear el producto" },
      { status: 500 }
    );
  }
}