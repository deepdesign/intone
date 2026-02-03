import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware - no database queries, just route protection
// Auth checks happen client-side or in API routes (Node.js runtime)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public routes - always allow access
  const publicRoutes = ["/", "/login", "/signup", "/pricing"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/auth"));
  
  // Always allow public routes to proceed immediately
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, just check if there's a session cookie
  // Actual auth validation happens in API routes (Node.js runtime)
  const sessionToken = req.cookies.get(
    process.env.NODE_ENV === "production" 
      ? "__Secure-authjs.session-token" 
      : "authjs.session-token"
  );
  
  const hasSession = !!sessionToken;
  
  // Onboarding route - allow if has session (actual validation in API)
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  if (isOnboardingRoute) {
    if (hasSession) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // API routes that require auth (except auth routes)
  const isApiRoute = pathname.startsWith("/api") && !pathname.startsWith("/api/auth");

  // App routes (require auth)
  const isAppRoute = pathname.startsWith("/app") || pathname.startsWith("/brands");

  // For API routes, let them through - they'll validate auth themselves (Node.js runtime)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // For app routes, check session cookie (actual validation happens client-side)
  if (isAppRoute) {
    // If no session cookie, redirect to landing
    // If has cookie, let through (client-side will validate)
    if (!hasSession) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // All other routes - allow through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
