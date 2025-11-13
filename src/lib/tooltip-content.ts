/**
 * Tooltip content configuration for educational tooltips
 * Now uses the i18n translation system for consistency
 */

import vi from '@/dictionaries/vi.json';
import en from '@/dictionaries/en.json';

export type Language = 'vi' | 'en';

export interface TooltipContent {
  title: string;
  content: string;
}

export interface TooltipContentMap {
  jd_analysis_importance: TooltipContent;
  ats_score_meaning: TooltipContent;
  ai_experience_benefits: TooltipContent;
  language_selection: TooltipContent;
  keyword_match_meaning: TooltipContent;
  formatting_meaning: TooltipContent;
  completeness_meaning: TooltipContent;
  relevance_meaning: TooltipContent;
}

const dictionaries = { vi, en };

/**
 * Get tooltip content for a specific key and language
 */
export function getTooltipContent(
  key: keyof TooltipContentMap,
  language: Language = 'vi'
): TooltipContent {
  const dict = dictionaries[language];
  const tooltips = dict.editor?.tooltips || {};
  
  return tooltips[key] || { title: '', content: '' };
}

/**
 * Get all tooltip content for a specific language
 */
export function getAllTooltipContent(language: Language = 'vi'): TooltipContentMap {
  const dict = dictionaries[language];
  const tooltips = dict.editor?.tooltips || {};
  
  return {
    jd_analysis_importance: tooltips.jd_analysis_importance || { title: '', content: '' },
    ats_score_meaning: tooltips.ats_score_meaning || { title: '', content: '' },
    ai_experience_benefits: tooltips.ai_experience_benefits || { title: '', content: '' },
    language_selection: tooltips.language_selection || { title: '', content: '' },
    keyword_match_meaning: tooltips.keyword_match_meaning || { title: '', content: '' },
    formatting_meaning: tooltips.formatting_meaning || { title: '', content: '' },
    completeness_meaning: tooltips.completeness_meaning || { title: '', content: '' },
    relevance_meaning: tooltips.relevance_meaning || { title: '', content: '' },
  };
}
