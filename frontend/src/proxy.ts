import { NextResponse, type NextRequest } from "next/server";

// Los nombres van escritos aquí y no importados de shared/constants/config a
// propósito: la documentación de Next advierte que el proxy puede desplegarse
// en el CDN aparte del código de render, y que no conviene depender de módulos
// compartidos. Si cambian allí, hay que cambiarlos aquí.
const COOKIE_TOKEN = "ss_sesion";
const COOKIE_USUARIO = "ss_usuario";

/**
 * Filtro grueso de rutas (en Next 16 esta convención se llama `proxy`; antes
 * era `middleware`). IMPORTANTE: esto NO es seguridad.
 *
 * No puede verificar la firma del JWT: es HS256 con `JWT_SECRET`, que vive solo
 * en el backend, y mandarlo aquí sería estrictamente peor que no validar. Por
 * tanto se puede burlar fabricando una cookie a mano — y no sirve de nada,
 * porque toda lectura o escritura real pasa por `verificarToken` en Express.
 *
 * Su único trabajo es evitar que se envíe el shell equivocado: sin esto, un
 * visitante deslogueado recibiría el panel de administración completo y solo
 * DESPUÉS sería redirigido, con el parpadeo visible.
 *
 * No "endurecer" esto creyendo que protege algo.
 */

const RUTAS_STAFF = ["/panel"];
const RUTAS_CLIENTE = ["/perfil"];
const RUTAS_AUTENTICADAS = ["/carrito/checkout"];
const RUTAS_DE_ENTRADA = ["/ingresar", "/crear-cuenta"];

interface UsuarioCookie {
  rol?: string;
}

export default function proxy(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;

  const token = peticion.cookies.get(COOKIE_TOKEN)?.value;
  const rol = leerRol(peticion.cookies.get(COOKIE_USUARIO)?.value);

  const necesitaStaff = coincide(pathname, RUTAS_STAFF);
  const necesitaCliente = coincide(pathname, RUTAS_CLIENTE);
  const necesitaSesion = necesitaStaff || necesitaCliente || coincide(pathname, RUTAS_AUTENTICADAS);

  if (necesitaSesion && !token) {
    return redirigir(peticion, `/ingresar?siguiente=${encodeURIComponent(pathname)}`);
  }

  // Rol equivocado para la sección: se manda a la portada de su propio rol.
  if (token && rol) {
    const esCliente = rol === "Cliente";

    if (necesitaStaff && esCliente) return redirigir(peticion, "/perfil");
    if (necesitaCliente && !esCliente) return redirigir(peticion, "/panel");

    // Ya autenticado: no tiene sentido mostrarle el formulario de ingreso.
    if (coincide(pathname, RUTAS_DE_ENTRADA)) {
      return redirigir(peticion, esCliente ? "/perfil" : "/panel");
    }
  }

  return NextResponse.next();
}

function leerRol(cookie: string | undefined): string | null {
  if (!cookie) return null;
  try {
    const datos = JSON.parse(decodeURIComponent(cookie)) as UsuarioCookie;
    return datos.rol ?? null;
  } catch {
    return null;
  }
}

function coincide(pathname: string, prefijos: string[]): boolean {
  return prefijos.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
}

function redirigir(peticion: NextRequest, destino: string) {
  return NextResponse.redirect(new URL(destino, peticion.url));
}

export const config = {
  matcher: ["/panel/:path*", "/perfil/:path*", "/carrito/checkout", "/ingresar", "/crear-cuenta"],
};
