import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/jobs", "/quotes", "/profile", "/admin", "/professional"];

// Paths that require an active Pro subscription
const proOnlyPaths = ["/jobs/new", "/messages"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: { name: string; value: string; options: CookieOptions }[]) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth check for protected paths
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (isProtected && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Subscription check for pro-only paths
  if (user && proOnlyPaths.some((path) => pathname.startsWith(path))) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
      .in("status", ["active"])
      .limit(1)
      .single();

    if (!subscription) {
      const pricing = new URL("/pricing", request.url);
      return NextResponse.redirect(pricing);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/payfast/notify|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
