import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renomme middleware.ts -> proxy.ts (voir AGENTS.md). Rafraîchit la
// session Supabase sur chaque requête et protège /admin et /dossier en redirigeant
// les visiteurs non connectés — les vérifications de rôle plus fines (ex: is_admin)
// restent dans les layouts serveur concernés.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/dossier");
  const isLoginPage =
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/connexion";

  if (isProtected && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.pathname.startsWith("/admin")
      ? "/admin/login"
      : "/connexion";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  return response;
}

export const proxyConfig = {
  matcher: ["/admin/:path*", "/dossier/:path*"],
};
