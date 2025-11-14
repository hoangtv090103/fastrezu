"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import vi from "@/dictionaries/vi.json";
import en from "@/dictionaries/en.json";

// Định nghĩa kiểu cho dictionary để TypeScript hỗ trợ autocomplete
type Dictionary = typeof vi;
type DictionaryKey = string;

const dictionaries: Record<'vi' | 'en', Dictionary> = { vi, en };

/**
 * Translation hook that uses LanguageContext for UI language
 * 
 * Usage:
 * ```tsx
 * const { t, locale } = useTranslation();
 * 
 * // Basic usage
 * t('common.loading') // "Đang tải..." (if locale is 'vi')
 * 
 * // With interpolation
 * t('wizard.stepProgress', { current: 1, total: 5 }) // "Bước 1 / 5"
 * ```
 */
export function useTranslation() {
  const { language: locale } = useLanguage();
  const dict = useMemo(() => dictionaries[locale] || dictionaries.vi, [locale]);

  /**
   * Translate function with support for nested keys and interpolation
   * @param key - Dot-notation key (e.g., 'dashboard.title')
   * @param variables - Object with variables to interpolate (e.g., { name: 'John' })
   */
  const t = (key: DictionaryKey, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dict;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Translation key missing: "${key}" for locale: "${locale}"`);
        }
        return key; // Return key if not found
      }
      current = current[k];
    }
    
    let result = typeof current === 'string' ? current : key;

    // Simple interpolation: replace {{variable}} with values
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      });
    }

    return result;
  };

  return { t, locale };
}

/**
 * Get translation function for a specific locale (utility function)
 * Useful for Server Components or utility functions
 */
export function getTranslation(locale: 'vi' | 'en' = 'vi') {
  const dict = dictionaries[locale] || dictionaries.vi;

  const t = (key: DictionaryKey, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dict;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Translation key missing: "${key}" for locale: "${locale}"`);
        }
        return key;
      }
      current = current[k];
    }
    
    let result = typeof current === 'string' ? current : key;

    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      });
    }

    return result;
  };

  return { t, locale };
}
