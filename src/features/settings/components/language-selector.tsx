'use client';

/**
 * Language Selector Component
 *
 * Dropdown component for switching between Thai and English languages.
 *
 * UI/UX: Professional Corporate style with navy blue accents
 * Constitution: Implements US12 (Localization) language switching
 */

import { useTransition } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useSettings } from '../hooks/use-settings';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../types';
import { cn } from '@/shared/lib/utils';

const LANGUAGE_OPTIONS: Record<SupportedLocale, { label: string; nativeLabel: string; flag: string }> = {
  en: {
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
  },
  th: {
    label: 'Thai',
    nativeLabel: 'ภาษาไทย',
    flag: '🇹🇭',
  },
};

interface LanguageSelectorProps {
  /** Show as compact button with just the flag */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Called when language changes */
  onLanguageChange?: (locale: SupportedLocale) => void;
}

export function LanguageSelector({
  compact = false,
  className,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const { settings, updateLanguage } = useSettings();

  const currentLocale = (settings?.locale as SupportedLocale) || 'en';

  const handleLanguageChange = (locale: SupportedLocale) => {
    startTransition(async () => {
      await updateLanguage(locale);
      onLanguageChange?.(locale);
    });
  };

  const currentLanguage = LANGUAGE_OPTIONS[currentLocale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'default'}
          className={cn(
            'gap-2 text-slate-700 hover:bg-slate-100 hover:text-navy-600',
            className
          )}
          disabled={isPending}
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          {!compact && (
            <>
              <span className="hidden sm:inline">{currentLanguage.nativeLabel}</span>
              <Globe className="h-4 w-4 text-slate-400" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_LOCALES.map((locale) => {
          const option = LANGUAGE_OPTIONS[locale];
          const isSelected = locale === currentLocale;

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className={cn(
                'flex items-center justify-between cursor-pointer',
                isSelected && 'bg-navy-50 text-navy-700'
              )}
              disabled={isPending}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.nativeLabel}</span>
                  <span className="text-xs text-slate-500">{option.label}</span>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-navy-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Language Selector for Settings Page
 *
 * Full-width version with labels for use in settings forms
 */
export function LanguageSelectorFull({
  className,
  onLanguageChange,
}: Omit<LanguageSelectorProps, 'compact'>) {
  const [isPending, startTransition] = useTransition();
  const { settings, updateLanguage } = useSettings();

  const currentLocale = (settings?.locale as SupportedLocale) || 'en';

  const handleLanguageChange = (locale: SupportedLocale) => {
    startTransition(async () => {
      await updateLanguage(locale);
      onLanguageChange?.(locale);
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-slate-700">
        {currentLocale === 'th' ? 'ภาษา' : 'Language'}
      </label>
      <div className="flex gap-2">
        {SUPPORTED_LOCALES.map((locale) => {
          const option = LANGUAGE_OPTIONS[locale];
          const isSelected = locale === currentLocale;

          return (
            <Button
              key={locale}
              variant={isSelected ? 'default' : 'outline'}
              size="lg"
              onClick={() => handleLanguageChange(locale)}
              disabled={isPending}
              className={cn(
                'flex-1 gap-2',
                isSelected
                  ? 'bg-navy-600 hover:bg-navy-700 text-white'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="text-xl">{option.flag}</span>
              <span>{option.nativeLabel}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        {currentLocale === 'th'
          ? 'เลือกภาษาที่ต้องการใช้งานในระบบ'
          : 'Select your preferred display language'}
      </p>
    </div>
  );
}

export default LanguageSelector;
