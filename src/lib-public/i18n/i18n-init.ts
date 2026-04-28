import i18next from 'i18next';
import pl from './lang/pl.json';
import en from './lang/en.json';

const DEFAULT_LANGUAGE = 'pl';
const SUPPORTED_LANGUAGES = ['pl', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function normalizeLanguage(language?: string | null): SupportedLanguage | undefined {
  if (!language) {
    return undefined;
  }

  const normalizedLanguage = language.trim().toLowerCase();

  return SUPPORTED_LANGUAGES.includes(normalizedLanguage as SupportedLanguage)
    ? (normalizedLanguage as SupportedLanguage)
    : undefined;
}

function resolveLanguage(language?: string): SupportedLanguage {
  return (
    normalizeLanguage(language) ??
    normalizeLanguage(process.env.KSEF_LANGUAGE) ??
    normalizeLanguage(i18next.isInitialized ? i18next.language : undefined) ??
    DEFAULT_LANGUAGE
  );
}

export async function initI18next(language?: string): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);

  if (!i18next.isInitialized) {
    await i18next.init({
      lng: resolvedLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      debug: false,
      resources: {
        en: { translation: en },
        pl: { translation: pl },
      },
    });
    return;
  }

  if (i18next.language !== resolvedLanguage) {
    await i18next.changeLanguage(resolvedLanguage);
  }
}
