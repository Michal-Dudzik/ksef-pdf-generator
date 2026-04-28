import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';
import { initI18next } from './i18n-init';

describe('initI18next', () => {
  const originalLanguageEnv = process.env.KSEF_LANGUAGE;

  afterEach(async () => {
    if (originalLanguageEnv === undefined) {
      delete process.env.KSEF_LANGUAGE;
    } else {
      process.env.KSEF_LANGUAGE = originalLanguageEnv;
    }

    await initI18next('pl');
  });

  it('defaults to Polish when no language is provided', async () => {
    delete process.env.KSEF_LANGUAGE;

    await initI18next('pl');

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
});
