/**
 * next-intl Configuration
 *
 * Provides internationalization support for Thai and English languages.
 *
 * Constitution: Supports localization requirements
 */

import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  // Get locale from user preference stored in database or cookie
  // For now, use accept-language header detection
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Simple language detection
  let locale: Locale = defaultLocale;
  if (acceptLanguage.includes("th")) {
    locale = "th";
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

/**
 * Get locale from cookie or header
 */
export function getLocaleFromRequest(acceptLanguage: string): Locale {
  if (acceptLanguage.includes("th")) {
    return "th";
  }
  return defaultLocale;
}

/**
 * Format date based on locale
 * Thai: DD/MM/YYYY
 * English: MM/DD/YYYY
 */
export function formatDateByLocale(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  };

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", defaultOptions).format(date);
}

/**
 * Format number based on locale
 */
export function formatNumberByLocale(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", options).format(number);
}
