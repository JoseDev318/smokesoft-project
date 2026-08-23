import { NextRequest, NextResponse } from "next/server";

const RUTAS_PROTEGIDAS = ["/panel"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esRutaProtegida = RUTAS_PROTEGIDAS.some((ruta) =>
    pathname.startsWith(ruta)
  );

  if (!esRutaProtegida) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};