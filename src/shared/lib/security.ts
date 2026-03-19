/**
 * Security Headers and Hardening Utilities
 *
 * Implements security best practices:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options, X-Content-Type-Options
 * - Referrer-Policy, Permissions-Policy
 * - Input sanitization helpers
 * - Security audit functions
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

import { NextResponse } from "next/server";

// CSP Configuration
export interface CSPConfig {
  reportOnly?: boolean;
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
}

/**
 * Generate Content Security Policy header
 */
export function generateCSP(config: CSPConfig = {}): string {
  const isDev = process.env.NODE_ENV === "development";

  const directives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // Allow inline scripts for Next.js (hashed in production)
      isDev ? "'unsafe-inline'" : "",
      // Allow eval in development for HMR
      isDev ? "'unsafe-eval'" : "",
      // Google Analytics (if configured)
      process.env.NEXT_PUBLIC_GA_ID ? "https://www.googletagmanager.com" : "",
      process.env.NEXT_PUBLIC_GA_ID ? "https://www.google-analytics.com" : "",
    ].filter(Boolean),
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for styled-components/Tailwind
      "https://fonts.googleapis.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      // Gravatar for user avatars
      "https://www.gravatar.com",
      // Google Analytics
      process.env.NEXT_PUBLIC_GA_ID ? "https://www.google-analytics.com" : "",
    ].filter(Boolean),
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ],
    "connect-src": [
      "'self'",
      // API endpoints
      process.env.NEXT_PUBLIC_API_URL || "",
      // Analytics
      process.env.NEXT_PUBLIC_GA_ID ? "https://www.google-analytics.com" : "",
      // S3 (if using direct uploads)
      process.env.AWS_S3_BUCKET ? `https://${process.env.AWS_S3_BUCKET}.s3.*.amazonaws.com` : "",
    ].filter(Boolean),
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "worker-src": ["'self' blob:"],
  };

  // Add report directive if configured
  if (config.reportUri) {
    directives["report-uri" as keyof typeof directives] = [config.reportUri];
  }

  // Add upgrade-insecure-requests in production
  if (config.upgradeInsecureRequests && !isDev) {
    directives["upgrade-insecure-requests" as keyof typeof directives] = [];
  }

  // Build CSP string
  const csp = Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");

  return csp;
}

/**
 * Security headers to apply to all responses
 */
export function getSecurityHeaders(config: CSPConfig = {}): Record<string, string> {
  const isDev = process.env.NODE_ENV === "development";
  const csp = generateCSP(config);

  return {
    // Content Security Policy
    [config.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"]: csp,

    // HTTP Strict Transport Security (1 year, include subdomains)
    "Strict-Transport-Security": isDev
      ? "max-age=0"
      : "max-age=31536000; includeSubDomains; preload",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // XSS Protection (legacy but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (formerly Feature Policy)
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),

    // Cache Control for sensitive pages
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",

    // Remove server identification
    "X-Powered-By": "",

    // Expect-CT (Certificate Transparency)
    "Expect-CT": isDev ? "" : "max-age=86400, enforce",
  };
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: CSPConfig = {}
): NextResponse {
  const headers = getSecurityHeaders(config);

  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      response.headers.set(key, value);
    } else if (key === "X-Powered-By") {
      response.headers.delete(key);
    }
  }

  return response;
}

/**
 * Security middleware for API routes
 */
export function securityMiddleware(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const response = await handler(request);

    // Apply security headers
    const headers = getSecurityHeaders();

    for (const [key, value] of Object.entries(headers)) {
      if (value && response.headers) {
        response.headers.set(key, value);
      }
    }

    return response;
  };
}

/**
 * Input sanitization utilities
 */
export const sanitization = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHTML(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  /**
   * Remove potentially dangerous characters
   */
  sanitizeInput(input: string): string {
    return input.replace(/[<>\"'&]/g, "");
  },

  /**
   * Sanitize filename to prevent path traversal
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/^\.+/, "")
      .substring(0, 255);
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(email: string): string | null {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : null;
  },

  /**
   * Sanitize URL to prevent javascript: and data: schemes
   */
  sanitizeURL(url: string): string | null {
    try {
      const parsed = new URL(url);
      const allowedSchemes = ["http:", "https:", "mailto:", "tel:"];
      if (!allowedSchemes.includes(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  },

  /**
   * Escape SQL LIKE wildcards
   */
  escapeLikeWildcards(input: string): string {
    return input.replace(/[%_]/g, "\\$&");
  },

  /**
   * Remove null bytes
   */
  removeNullBytes(input: string): string {
    return input.replace(/\0/g, "");
  },
};

/**
 * Security audit functions
 */
export const securityAudit = {
  /**
   * Check for common security vulnerabilities in user input
   */
  checkInputVulnerabilities(input: string): {
    hasSQLInjection: boolean;
    hasXSS: boolean;
    hasPathTraversal: boolean;
    hasCommandInjection: boolean;
  } {
    const sqlPatterns = [
      /('|")/i,
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER)\b)/i,
      /(\/\*|\*\/)/,
      /(--|#)/,
    ];

    const xssPatterns = [
      /<script\b/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i,
      /vbscript:/i,
    ];

    const pathTraversalPatterns = [
      /\.\./,
      /%2e%2e/i,
      /\.\.%2f/i,
      /%2e%2e\//i,
    ];

    const commandInjectionPatterns = [
      /[;&|`$]/,
      /\$\(/,
      /\|\|/,
      /&&/,
    ];

    return {
      hasSQLInjection: sqlPatterns.some((p) => p.test(input)),
      hasXSS: xssPatterns.some((p) => p.test(input)),
      hasPathTraversal: pathTraversalPatterns.some((p) => p.test(input)),
      hasCommandInjection: commandInjectionPatterns.some((p) => p.test(input)),
    };
  },

  /**
   * Check password strength
   */
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (password.length < 8) feedback.push("Use at least 8 characters");
    if (!/[a-z]/.test(password)) feedback.push("Include lowercase letters");
    if (!/[A-Z]/.test(password)) feedback.push("Include uppercase letters");
    if (!/[0-9]/.test(password)) feedback.push("Include numbers");
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push("Include special characters");

    // Check for common patterns
    const commonPatterns = [
      /123/,
      /abc/i,
      /qwerty/i,
      /password/i,
      /admin/i,
    ];
    if (commonPatterns.some((p) => p.test(password))) {
      score = Math.max(0, score - 2);
      feedback.push("Avoid common patterns");
    }

    return {
      score,
      feedback,
      isStrong: score >= 5 && feedback.length <= 1,
    };
  },

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  },

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  },
};

/**
 * CORS configuration for API routes
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
  const isAllowed = allowedOrigins.includes("*") || (origin && allowedOrigins.includes(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  generateCSP,
  getSecurityHeaders,
  applySecurityHeaders,
  securityMiddleware,
  sanitization,
  securityAudit,
  getCORSHeaders,
};
