import i18next from 'i18next';
import pl from './lang/pl.json';
import en from './lang/en.json';

const DEFAULT_LANGUAGE = 'pl';
const SUPPORTED_LANGUAGES = ['pl', 'en'] as const;
let initPromise: Promise<void> | null = null;

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

function initializeI18next(language: SupportedLanguage): Promise<void> {
  if (!initPromise) {
    const pendingInit = i18next
      .init({
        lng: language,
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        debug: false,
        resources: {
          en: { translation: en },
          pl: { translation: pl },
        },
      })
      .then(() => undefined);

    let trackedInitPromise: Promise<void>;
    trackedInitPromise = pendingInit.finally(() => {
      if (initPromise === trackedInitPromise) {
        initPromise = null;
      }
    });

    initPromise = trackedInitPromise;
  }

  return initPromise;
}

export async function initI18next(language?: string): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);
  const pendingInit = !i18next.isInitialized ? initializeI18next(resolvedLanguage) : initPromise;

  if (pendingInit) {
    await pendingInit;
  }

  if (i18next.language !== resolvedLanguage) {
    await i18next.changeLanguage(resolvedLanguage);
  }
}
