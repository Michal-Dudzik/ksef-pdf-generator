import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initI18next } from './i18n-init';
import pl from './lang/pl.json';
import en from './lang/en.json';

function collectLeafPaths(value: unknown, basePath = ''): string[] {
  if (!value || typeof value !== 'object') {
    return [basePath];
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return [basePath];
  }

  return entries.flatMap(([key, nestedValue]) => {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    return collectLeafPaths(nestedValue, nextPath);
  });
}

describe('initI18next', () => {
  const originalLanguageEnv = process.env.KSEF_LANGUAGE;

  afterEach(async () => {
    vi.restoreAllMocks();

    if (originalLanguageEnv === undefined) {
      delete process.env.KSEF_LANGUAGE;
    } else {
      process.env.KSEF_LANGUAGE = originalLanguageEnv;
    }

    await initI18next('pl');
  });

  it('reuses the same init promise for concurrent callers', async () => {
    const mutableI18next = i18next as typeof i18next & {
      isInitialized: boolean;
      language: string;
    };
    let releaseInit: (() => void) | undefined;
    let resolveInitStarted: (() => void) | undefined;
    const initStarted = new Promise<void>((resolve) => {
      resolveInitStarted = resolve;
    });

    mutableI18next.isInitialized = false;
    mutableI18next.language = 'pl';

    const initSpy = vi.spyOn(i18next, 'init').mockImplementation(async (options) => {
      resolveInitStarted?.();
      await new Promise<void>((resolve) => {
        releaseInit = resolve;
      });

      mutableI18next.isInitialized = true;
      mutableI18next.language = String(options.lng);

      return i18next as never;
    });

    const changeLanguageSpy = vi.spyOn(i18next, 'changeLanguage').mockImplementation(async (language) => {
      mutableI18next.language = String(language);

      return i18next as never;
    });

    const firstInit = initI18next('pl');
    await initStarted;
    const secondInit = initI18next('en');

    expect(initSpy).toHaveBeenCalledTimes(1);

    releaseInit?.();
    await Promise.all([firstInit, secondInit]);

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    expect(i18next.language).toBe('en');
  });

  it('defaults to Polish when no language is provided', async () => {
    delete process.env.KSEF_LANGUAGE;

    await initI18next();

    expect(i18next.language).toBe('pl');
    expect(i18next.t('invoice.header.vat')).toBe('Faktura podstawowa');
  });

  it('switches language when an explicit language is provided', async () => {
    await initI18next('en');

    expect(i18next.language).toBe('en');
    expect(i18next.t('invoice.header.vat')).toBe('ExampleText');
  });

  it('uses KSEF_LANGUAGE when no explicit language is provided', async () => {
    process.env.KSEF_LANGUAGE = 'en';

    await initI18next();

    expect(i18next.language).toBe('en');
    expect(i18next.t('invoice.header.vat')).toBe('ExampleText');
  });

  it('normalizes explicit language value', async () => {
    await initI18next(' EN ');

    expect(i18next.language).toBe('en');
  });

  it('falls back to KSEF_LANGUAGE when explicit language is invalid', async () => {
    process.env.KSEF_LANGUAGE = 'en';

    await initI18next('de');

    expect(i18next.language).toBe('en');
    expect(i18next.t('invoice.header.vat')).toBe('ExampleText');
  });

  it('keeps translation key structure in sync between pl and en', async () => {
    const plKeys = new Set(collectLeafPaths(pl));
    const enKeys = new Set(collectLeafPaths(en));

    const missingInEn = [...plKeys].filter((key) => !enKeys.has(key));
    const missingInPl = [...enKeys].filter((key) => !plKeys.has(key));

    expect(missingInEn).toEqual([]);
    expect(missingInPl).toEqual([]);
  });

  it('resolves the dedicated FA1 3oo tax-rate label in Polish', async () => {
    await initI18next('pl');

    expect(i18next.t('const.fa.taxRate3oo')).toBe('4% lub 3% lub oo');
  });
});
