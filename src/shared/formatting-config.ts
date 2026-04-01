const CURRENCY_THOUSANDS_SEPARATOR_ENV = 'KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR';

type RuntimeFormattingConfig = {
  useCurrencyThousandsSeparator?: boolean;
};

let runtimeFormattingConfig: RuntimeFormattingConfig = {};

export function applyRuntimeFormattingConfig(config?: RuntimeFormattingConfig): void {
  runtimeFormattingConfig = {
    useCurrencyThousandsSeparator: config?.useCurrencyThousandsSeparator,
  };
}

export function resetRuntimeFormattingConfig(): void {
  runtimeFormattingConfig = {};
}

// Plain boolean enable tokens — no separator-type semantics.
const BOOLEAN_ENABLE_TOKENS = new Set(['1', 'true', 'yes', 'on']);

// 'space' and 'nbsp' both enable the separator AND carry separator-type semantics.
// They are kept in a separate set so getCurrencyThousandsSeparatorChar() can distinguish
// which exact character to insert without re-parsing the same env value.
const SEPARATOR_CHAR_TOKENS = new Set(['space', 'nbsp']);

export function shouldUseCurrencyThousandsSeparator(): boolean {
  if (runtimeFormattingConfig.useCurrencyThousandsSeparator !== undefined) {
    return runtimeFormattingConfig.useCurrencyThousandsSeparator;
  }

  const configuredValue = process?.env?.[CURRENCY_THOUSANDS_SEPARATOR_ENV]?.trim().toLowerCase();
  if (configuredValue === undefined) return false;

  return BOOLEAN_ENABLE_TOKENS.has(configuredValue) || SEPARATOR_CHAR_TOKENS.has(configuredValue);
}

/**
 * Returns the exact character to insert as the thousands separator when
 * {@link shouldUseCurrencyThousandsSeparator} is true.
 *
 * - `KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR=space` → regular space (U+0020)
 * - `KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR=nbsp`  → non-breaking space (U+00A0, default)
 * - Any other truthy token (true, 1, yes, on)         → non-breaking space (U+00A0, default)
 *
 * When the feature is enabled via the runtime config API (not via env var) the
 * default non-breaking space is always used.
 */
export function getCurrencyThousandsSeparatorChar(): string {
  const configuredValue = process?.env?.[CURRENCY_THOUSANDS_SEPARATOR_ENV]?.trim().toLowerCase();

  if (configuredValue === 'space') {
    return ' '; // U+0020 regular space
  }

  return '\u00A0'; // U+00A0 non-breaking space (default)
}

