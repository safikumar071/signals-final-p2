// Language configuration constants
export const SUPPORTED_LANGUAGES = [
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸', 
    rtl: false,
    nativeName: 'English'
  },
  { 
    code: 'es', 
    name: 'Español', 
    flag: '🇪🇸', 
    rtl: false,
    nativeName: 'Español'
  },
  { 
    code: 'fr', 
    name: 'Français', 
    flag: '🇫🇷', 
    rtl: false,
    nativeName: 'Français'
  },
  { 
    code: 'de', 
    name: 'Deutsch', 
    flag: '🇩🇪', 
    rtl: false,
    nativeName: 'Deutsch'
  },
  { 
    code: 'hi', 
    name: 'हिन्दी', 
    flag: '🇮🇳', 
    rtl: false,
    nativeName: 'हिन्दी'
  },
  { 
    code: 'zh', 
    name: '中文', 
    flag: '🇨🇳', 
    rtl: false,
    nativeName: '中文'
  },
  { 
    code: 'ja', 
    name: '日本語', 
    flag: '🇯🇵', 
    rtl: false,
    nativeName: '日本語'
  },
  { 
    code: 'ar', 
    name: 'العربية', 
    flag: '🇸🇦', 
    rtl: true,
    nativeName: 'العربية'
  },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Default language
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Get language info by code
export function getLanguageInfo(code: LanguageCode) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
}

// Check if language is RTL
export function isRTL(code: LanguageCode): boolean {
  return getLanguageInfo(code).rtl;
}