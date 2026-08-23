import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { usuario, clave } = await request.json();

  let respuestaBackend: Response;

  try {
    respuestaBackend = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, clave }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const datos = await respuestaBackend.json();

  if (!respuestaBackend.ok) {
    return NextResponse.json(datos, { status: respuestaBackend.status });
  }

  const response = NextResponse.json({ usuario: datos.usuario });

  response.cookies.set("token", datos.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}