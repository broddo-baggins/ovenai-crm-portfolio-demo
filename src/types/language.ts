export type SupportedLanguage = 'en' | 'he';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  fontFamily: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    fontFamily: 'font-sans'
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    fontFamily: 'font-hebrew'
  }
}; 