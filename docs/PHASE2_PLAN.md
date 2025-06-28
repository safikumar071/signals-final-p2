# 🌍 Phase 2: Language Localization System

## Overview
Implement dynamic language switching with proper string localization throughout the app.

## 🎯 Goals

1. **Multi-language Support**: English, Spanish, French, German, Hindi, Chinese, Japanese, Arabic
2. **Dynamic Switching**: Change language without app restart
3. **Persistent Preference**: Save language choice in profile
4. **RTL Support**: Right-to-left languages (Arabic)
5. **Fallback System**: Default to English if translation missing

## 📦 Required Dependencies

```bash
npm install react-i18next i18next
```

## 🏗️ Implementation Plan

### Step 1: Setup i18next Configuration
- **File**: `lib/i18n.ts`
- **Features**: 
  - Language detection from profile
  - Resource loading
  - Fallback configuration
  - RTL detection

### Step 2: Create Translation Files
- **Structure**: `locales/[lang]/common.json`
- **Languages**: en, es, fr, de, hi, zh, ja, ar
- **Categories**: 
  - Navigation
  - Onboarding
  - Profile
  - Signals
  - Common UI

### Step 3: Language Context Provider
- **File**: `contexts/LanguageContext.tsx`
- **Features**:
  - Current language state
  - Change language function
  - RTL detection
  - Profile sync

### Step 4: Update Components
- **Replace**: Hard-coded strings with `t('key')`
- **Components**: All screens and components
- **Special**: Date/number formatting

### Step 5: Language Selector UI
- **Location**: Profile screen + Onboarding
- **Design**: Flag + Name dropdown
- **Behavior**: Immediate language switch

## 🗂️ File Structure

```
locales/
├── en/
│   ├── common.json
│   ├── onboarding.json
│   ├── profile.json
│   └── signals.json
├── es/
│   └── ...
├── fr/
│   └── ...
└── ...

lib/
├── i18n.ts
└── languageUtils.ts

contexts/
└── LanguageContext.tsx
```

## 🎨 Language Selector Design

```typescript
// Language options with flags and names
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'zh', name: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];
```

## 🔄 Integration Points

### Profile System Integration
- Load language from `user_profiles.language`
- Update profile when language changes
- Sync with AsyncStorage

### Theme System Integration
- RTL layout adjustments
- Text direction changes
- Icon mirroring for RTL

## 📋 Translation Keys Structure

```json
{
  "navigation": {
    "home": "Home",
    "signals": "Signals", 
    "calculator": "Calculator",
    "profile": "Profile"
  },
  "onboarding": {
    "welcome": "Welcome to Gold & Silver Signals",
    "subtitle": "Let's set up your profile",
    "name": "Full Name",
    "dob": "Date of Birth",
    "language": "Preferred Language",
    "getStarted": "Get Started"
  },
  "profile": {
    "title": "Profile",
    "editProfile": "Edit Profile",
    "name": "Name",
    "dateOfBirth": "Date of Birth",
    "language": "Language",
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

## ⚡ Performance Considerations

1. **Lazy Loading**: Load translations on demand
2. **Caching**: Cache translations in AsyncStorage
3. **Bundle Size**: Only include needed languages
4. **Memory**: Unload unused translations

## 🧪 Testing Strategy

1. **Language Switching**: Test all language combinations
2. **RTL Layout**: Verify Arabic layout correctness
3. **Persistence**: Language survives app restart
4. **Fallbacks**: Missing translations show English
5. **Performance**: No lag during language switch

## 🚀 Ready to Implement?

This plan provides a comprehensive localization system that integrates seamlessly with the existing profile system from Phase 1.

Would you like me to start implementing Phase 2?