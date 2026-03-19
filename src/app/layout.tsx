import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Performance Metrics Portal",
    template: "%s | Performance Metrics Portal",
  },
  description: "Enterprise performance review and evaluation management system",
  keywords: ["performance", "evaluation", "HR", "enterprise", "corporate"],
  authors: [{ name: "PMP Team" }],
  creator: "PMP",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["th_TH"],
    title: "Performance Metrics Portal",
    description: "Enterprise performance review and evaluation management system",
    siteName: "Performance Metrics Portal",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
