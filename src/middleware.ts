/**
 * Middleware for Auth & i18n
 *
 * Handles authentication checks and internationalization routing.
 */

import { createMiddleware } from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Supported locales
export const locales = ["en", "th"] as const;
export const defaultLocale = "en" as const;

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

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: undefined, // No prefix in URL
  localeDetection: false, // We handle detection manually
});

function getLocaleFromCookie(request: NextRequest): string | undefined {
  const localeCookie = request.cookies.get("locale");
  if (localeCookie && locales.includes(localeCookie.value as typeof locales[number])) {
    return localeCookie.value;
  }
  return undefined;
}

function getLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") || "";
  if (acceptLanguage.includes("th")) {
    return "th";
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
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

  // Determine locale: cookie > header > default
  const locale = getLocaleFromCookie(request) || getLocaleFromHeader(request);

  // Create response with locale info
  const response = NextResponse.next();

  // Set locale header for server components
  response.headers.set("x-locale", locale);

  // Set locale cookie if not already set
  if (!request.cookies.get("locale")) {
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|public|_ver).*)",
  ],
};
