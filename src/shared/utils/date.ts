/**
 * Date Formatting Utilities
 *
 * Provides consistent date formatting across the application.
 * Supports both Thai and English locales.
 */

import { LanguageCode } from "../types/common";

/**
 * Date format options
 */
export type DateFormat =
  | "short" // DD/MM/YYYY or MM/DD/YYYY
  | "long" // March 19, 2026
  | "full" // Thursday, March 19, 2026
  | "datetime" // DD/MM/YYYY HH:mm
  | "time" // HH:mm
  | "iso"; // ISO 8601

/**
 * Format date based on locale and format type
 */
export function formatDate(
  date: Date | string,
  locale: LanguageCode = "en",
  format: DateFormat = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  const localeString = locale === "th" ? "th-TH" : "en-US";

  switch (format) {
    case "short":
      return new Intl.DateTimeFormat(localeString, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);

    case "long":
      return new Intl.DateTimeFormat(localeString, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);

    case "full":
      return new Intl.DateTimeFormat(localeString, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);

    case "datetime":
      return new Intl.DateTimeFormat(localeString, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);

    case "time":
      return new Intl.DateTimeFormat(localeString, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);

    case "iso":
      return d.toISOString();

    default:
      return d.toLocaleDateString(localeString);
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: LanguageCode = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const localeString = locale === "th" ? "th-TH" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(localeString, { numeric: "auto" });

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, "second");
  }
  if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }
  if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, "week");
  }
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }
  return rtf.format(diffYears, "year");
}

/**
 * Check if a date is past a deadline
 */
export function isPastDeadline(deadline: Date | string): boolean {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return d.getTime() < Date.now();
}

/**
 * Get days remaining until deadline
 */
export function getDaysRemaining(deadline: Date | string): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format date for API (ISO 8601)
 */
export function toApiDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format date for form input (YYYY-MM-DD)
 */
export function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0] ?? "";
}

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if date is within a range
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  return d >= start && d <= end;
}
