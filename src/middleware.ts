/**
 * Middleware for Auth, i18n & Security
 *
 * Handles authentication checks, internationalization routing,
 * and security headers including CSP with nonce support.
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

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

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API for Edge runtime compatibility
 */
async function generateNonce(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Convert to base64 without using Buffer (Edge runtime compatible)
  return btoa(String.fromCharCode(...array));
}

/**
 * Build Content Security Policy header value with nonce
 */
function buildCSP(nonce: string, isDevelopment: boolean): string {
  const cspDirectives = [
    // Default fallback
    "default-src 'self'",
    // Scripts: allow self, nonce, and unsafe-inline/eval for Next.js compatibility
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Styles: allow self, inline (for Tailwind), and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: allow self, Google Fonts, and data URIs
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: allow self, data URIs, blobs, and external HTTPS
    "img-src 'self' data: blob: https:",
    // Connect: allow self and specific external APIs
    "connect-src 'self' https://api.github.com",
    // Prevent framing (clickjacking protection)
    "frame-ancestors 'none'",
    // Restrict base URI
    "base-uri 'self'",
    // Restrict form submissions
    "form-action 'self'",
    // Disallow plugins
    "object-src 'none'",
    // Enable CSP reporting (optional - configure endpoint as needed)
    // "report-uri /api/csp-report",
  ];

  return cspDirectives.join('; ');
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

  // === Security Headers ===

  // Generate nonce for CSP (using Web Crypto API for Edge runtime)
  const nonce = await generateNonce();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Set CSP header with nonce
  const csp = buildCSP(nonce, isDevelopment);
  response.headers.set('Content-Security-Policy', csp);

  // Make nonce available to the application (for use in _document or layout)
  response.headers.set('x-nonce', nonce);

  // Additional security headers (backup for those in next.config.js)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|public|_ver).*)",
  ],
};
