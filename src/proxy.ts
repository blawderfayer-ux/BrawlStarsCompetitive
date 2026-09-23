import { NextResponse, type NextRequest } from "next/server";

/**
 * Chequeo optimista: si no hay cookie de sesión, manda al login antes de renderizar el panel.
 * La verificación real (firma, usuario activo y rol) se hace en cada página y cada acción.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) return NextResponse.next();
  if (!request.cookies.has("bt_session")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
