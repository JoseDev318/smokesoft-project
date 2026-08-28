import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nuevo = await fetchBackend("/clientes", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(nuevo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el cliente" },
      { status: 500 }
    );
  }
}