import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'th'],
  defaultLocale: 'en',
  localePrefix: 'never', // Don't show locale in URL (e.g., /dashboard instead of /en/dashboard)
});
