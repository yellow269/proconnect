import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRODUCTION_DOMAIN = "proconnect.co.za";

const protectedPaths = ["/dashboard", "/jobs", "/quotes", "/profile", "/admin", "/professional"];
const customerOnlyPaths = ["/jobs/new", "/dashboard/post-job"];
const professionalOnlyPaths = ["/professional"];
const proOnlyPaths = ["/messages"];

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  if (hostname !== PRODUCTION_DOMAIN) {
    const target = new URL(request.nextUrl);
    target.hostname = PRODUCTION_DOMAIN;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

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

  // Role-based access control - only check if user is authenticated and path is role-restricted
  if (user) {
    const isCustomerOnly = customerOnlyPaths.some((path) => pathname === path);
    const isProfessionalOnly = professionalOnlyPaths.some((path) => pathname.startsWith(path));

    if (isCustomerOnly || isProfessionalOnly) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      const role = profile?.role as string | undefined;

      if (isCustomerOnly && role === "professional") {
        return NextResponse.redirect(new URL("/professional", request.url));
      }

      if (isProfessionalOnly && role === "customer") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
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
      const dashboard = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboard);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
