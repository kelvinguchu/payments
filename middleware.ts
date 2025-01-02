import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // Create a response to modify
    const res = NextResponse.next();

    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res });

    // Get the session once and reuse it
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const pathname = request.nextUrl.pathname;

    // Handle auth pages
    if (pathname.startsWith("/auth")) {
      if (session) {
        // If user is signed in and the current path starts with /auth
        // redirect the user to /dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Allow access to auth pages for non-authenticated users
      return res;
    }

    // Handle root path
    if (pathname === "/") {
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Check auth status for protected routes
    if (pathname.startsWith("/dashboard")) {
      if (!session) {
        // If user is not signed in and trying to access dashboard
        // redirect the user to /auth/login
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      // User is authenticated, allow access to dashboard
      return res;
    }

    // Return the response with the session
    return res;
  } catch (e) {
    console.error("Middleware error:", e);
    // If there's an error, redirect to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
