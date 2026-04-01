import { afterEach, describe, expect, it } from 'vitest';
import {
  applyRuntimeFormattingConfig,
  getCurrencyThousandsSeparatorChar,
  resetRuntimeFormattingConfig,
  shouldUseCurrencyThousandsSeparator,
} from './formatting-config';

describe('shouldUseCurrencyThousandsSeparator', () => {
  const currencyThousandsSeparatorEnv = process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR;

  afterEach(() => {
    resetRuntimeFormattingConfig();

    if (currencyThousandsSeparatorEnv === undefined) {
      delete process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR;
      return;
    }

    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = currencyThousandsSeparatorEnv;
  });

  it('uses environment configuration when runtime override is not set', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'true';

    expect(shouldUseCurrencyThousandsSeparator()).toBe(true);
  });

  it('prefers runtime configuration over environment configuration', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'false';
    applyRuntimeFormattingConfig({ useCurrencyThousandsSeparator: true });

    expect(shouldUseCurrencyThousandsSeparator()).toBe(true);
  });

  it('resets runtime configuration back to environment configuration', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'false';
    applyRuntimeFormattingConfig({ useCurrencyThousandsSeparator: true });
    resetRuntimeFormattingConfig();

    expect(shouldUseCurrencyThousandsSeparator()).toBe(false);
  });

  it('enables separator for "space" token', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'space';

    expect(shouldUseCurrencyThousandsSeparator()).toBe(true);
  });

  it('enables separator for "nbsp" token', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'nbsp';

    expect(shouldUseCurrencyThousandsSeparator()).toBe(true);
  });
});

describe('getCurrencyThousandsSeparatorChar', () => {
  const currencyThousandsSeparatorEnv = process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR;

  afterEach(() => {
    if (currencyThousandsSeparatorEnv === undefined) {
      delete process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR;
      return;
    }

    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = currencyThousandsSeparatorEnv;
  });

  it('returns non-breaking space (U+00A0) when env var is absent', () => {
    delete process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR;

    expect(getCurrencyThousandsSeparatorChar()).toBe('\u00A0');
  });

  it('returns non-breaking space (U+00A0) for boolean enable tokens', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'true';

    expect(getCurrencyThousandsSeparatorChar()).toBe('\u00A0');
  });

  it('returns non-breaking space (U+00A0) for "nbsp" token', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'nbsp';

    expect(getCurrencyThousandsSeparatorChar()).toBe('\u00A0');
  });

  it('returns regular space (U+0020) for "space" token', () => {
    process.env.KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR = 'space';

    expect(getCurrencyThousandsSeparatorChar()).toBe(' ');
  });
});
