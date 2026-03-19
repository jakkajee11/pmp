/**
 * Middleware for Auth & i18n
 *
 * Handles authentication checks and internationalization routing.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/evaluations",
  "/objectives",
  "/cycles",
  "/users",
  "/reports",
  "/audit-logs",
  "/settings",
  "/org-chart",
];

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/error",
];

// Locale detection
const locales = ["en", "th"] as const;
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  // Check cookie first
  const localeCookie = request.cookies.get("locale");
  if (localeCookie && locales.includes(localeCookie.value as typeof locales[number])) {
    return localeCookie.value;
  }

  // Check accept-language header
  const acceptLanguage = request.headers.get("accept-language") || "";
  if (acceptLanguage.includes("th")) {
    return "th";
  }

  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except auth-protected ones)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get token for authentication check
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users to sign in
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from sign in page
  if (pathname === "/auth/signin" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Set locale in response headers
  const locale = getLocale(request);
  const response = NextResponse.next();

  // Add locale header for server components
  response.headers.set("x-locale", locale);

  // Set locale cookie if not set
  if (!request.cookies.get("locale")) {
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
