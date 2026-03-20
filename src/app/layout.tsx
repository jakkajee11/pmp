import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * Inter font configuration - Professional Corporate typography
 * Clean, modern sans-serif optimized for enterprise applications
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/**
 * Application metadata for SEO and social sharing
 * Professional Corporate branding for enterprise HR system
 */
export const metadata: Metadata = {
  title: {
    default: "Performance Metrics Portal",
    template: "%s | Performance Metrics Portal",
  },
  description:
    "Enterprise performance review and evaluation management system. Streamline employee assessments, track objectives, and manage review cycles with professional-grade tools.",
  keywords: [
    "performance management",
    "employee evaluation",
    "HR software",
    "enterprise",
    "corporate",
    "review cycles",
    "objectives tracking",
    "self-assessment",
    "manager review",
  ],
  authors: [{ name: "PMP Team" }],
  creator: "PMP",
  publisher: "Performance Metrics Portal",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["th_TH"],
    title: "Performance Metrics Portal",
    description:
      "Enterprise performance review and evaluation management system",
    siteName: "Performance Metrics Portal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Performance Metrics Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Performance Metrics Portal",
    description:
      "Enterprise performance review and evaluation management system",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

/**
 * Viewport configuration for optimal mobile experience
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e3a5f" },
    { media: "(prefers-color-scheme: dark)", color: "#1a2f4a" },
  ],
};

/**
 * Root Layout Component
 *
 * Provides the foundational structure for the application with:
 * - Semantic HTML structure for accessibility
 * - Internationalization support via next-intl
 * - Session management for authentication
 * - Toast notifications for user feedback
 * - Professional Corporate styling
 *
 * @param children - Page content to render
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            {/* Skip to main content link for keyboard accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to main content
            </a>

            {/* Application root with semantic structure */}
            <div className="relative flex min-h-screen flex-col">
              {/* Header landmark - to be provided by layout wrapper */}
              {/* Main content area */}
              <main id="main-content" className="flex-1" role="main">
                {children}
              </main>
              {/* Footer landmark - to be provided by layout wrapper */}
            </div>

            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "bg-card border border-border text-foreground shadow-card",
                  title: "font-medium",
                  description: "text-muted-foreground",
                  success: "border-success/50 bg-success/5",
                  error: "border-destructive/50 bg-destructive/5",
                  warning: "border-warning/50 bg-warning/5",
                  info: "border-info/50 bg-info/5",
                },
              }}
            />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
