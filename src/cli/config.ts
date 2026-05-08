import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';

const CONFIG_FILE_NAME = 'parameters.ini';
const NUMBER_DECIMALS_ENV = 'KSEF_FORMAT_NUMBER_DECIMALS';
const CURRENCY_THOUSANDS_SEPARATOR_ENV = 'KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR';
const LANGUAGE_ENV = 'KSEF_LANGUAGE';
const SUPPORTED_LANGUAGES = ['pl', 'en'] as const;

type AppConfig = {
  numberFormat?: {
    decimals?: number | null;
  };
  currencyFormat?: {
    thousandsSeparator?: boolean;
  };
  i18n?: {
    language?: (typeof SUPPORTED_LANGUAGES)[number];
  };
};

function isPackagedRuntime(): boolean {
  return !!((process as any).pkg || (process as any).isSEA);
}

function getConfigSearchPaths(): string[] {
  const envConfigPath = process.env.KSEF_CONFIG_PATH;
  if (envConfigPath) {
    return [path.resolve(envConfigPath)];
  }

  const exeDir = path.dirname(process.execPath);
  const cwdDir = process.cwd();

  if (isPackagedRuntime()) {
    return [path.join(exeDir, CONFIG_FILE_NAME), path.join(cwdDir, CONFIG_FILE_NAME)];
  }

  return [path.join(cwdDir, CONFIG_FILE_NAME), path.join(exeDir, CONFIG_FILE_NAME)];
}

function parseConfig(filePath: string): AppConfig | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseIniConfig(content, filePath);
  } catch (error) {
    log(`Failed to parse config file "${filePath}", using defaults`, 'error');
    return null;
  }
}

function parseIniConfig(content: string, filePath: string): AppConfig {
  const result: AppConfig = {};
  let section = '';

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNumber = i + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1).trim().toLowerCase();
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex < 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim().toLowerCase();
    const valuePart = line.slice(equalsIndex + 1).trim();
    const value = valuePart.split(/[;#]/, 1)[0].trim();

    if (section === 'numberformat' && key === 'decimals') {
      if (value.toLowerCase() === 'null') {
        result.numberFormat = { decimals: null };
        continue;
      }

      if (!value) {
        log(
          `Invalid "numberFormat.decimals" in ${filePath}:${lineNumber}. Expected integer >= 0 or "null". Using default behavior.`,
          'error'
        );
        continue;
      }

      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed >= 0) {
        result.numberFormat = { decimals: parsed };
      } else {
        log(
          `Invalid "numberFormat.decimals" in ${filePath}:${lineNumber}. Expected integer >= 0 or "null". Using default behavior.`,
          'error'
        );
      }
    }

    if (section === 'currencyformat' && key === 'thousands_separator') {
      if (!value) {
        log(
          `Invalid "currencyFormat.thousands_separator" in ${filePath}:${lineNumber}. Expected boolean true/false. Using default behavior.`,
          'error'
        );
        continue;
      }

      if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) {
        result.currencyFormat = { thousandsSeparator: true };
        continue;
      }

      if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) {
        result.currencyFormat = { thousandsSeparator: false };
        continue;
      }

      log(
        `Invalid "currencyFormat.thousands_separator" in ${filePath}:${lineNumber}. Expected boolean true/false. Using default behavior.`,
        'error'
      );
    }

    if (section === 'i18n' && key === 'language') {
      if (!value) {
        log(
          `Invalid "i18n.language" in ${filePath}:${lineNumber}. Expected one of: ${SUPPORTED_LANGUAGES.join(', ')}. Using default behavior.`,
          'error'
        );
        continue;
      }

      const normalizedLanguage = value.toLowerCase();

      if (SUPPORTED_LANGUAGES.includes(normalizedLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
        result.i18n = { language: normalizedLanguage as (typeof SUPPORTED_LANGUAGES)[number] };
        continue;
      }

      log(
        `Invalid "i18n.language" in ${filePath}:${lineNumber}. Expected one of: ${SUPPORTED_LANGUAGES.join(', ')}. Using default behavior.`,
        'error'
      );
    }
  }

  return result;
}

function applyNumberFormatConfig(config: AppConfig, filePath: string): void {
  const decimals = config.numberFormat?.decimals;

  if (decimals === undefined) {
    return;
  }

  if (decimals === null) {
    process.env[NUMBER_DECIMALS_ENV] = 'none';
    log(`Config loaded from ${filePath}: FormatTyp.Number decimals=legacy`, 'info');
    return;
  }

  if (Number.isInteger(decimals) && decimals >= 0) {
    process.env[NUMBER_DECIMALS_ENV] = String(decimals);
    log(`Config loaded from ${filePath}: FormatTyp.Number decimals=${decimals}`, 'info');
    return;
  }

  log(
    `Invalid "numberFormat.decimals" in ${filePath}. Expected integer >= 0 or null. Using default behavior.`,
    'error'
  );
}

function applyCurrencyFormatConfig(config: AppConfig, filePath: string): void {
  const thousandsSeparator = config.currencyFormat?.thousandsSeparator;

  if (thousandsSeparator === undefined) {
    return;
  }

  process.env[CURRENCY_THOUSANDS_SEPARATOR_ENV] = thousandsSeparator ? 'true' : 'false';
  log(
    `Config loaded from ${filePath}: currencyFormat.thousands_separator=${thousandsSeparator}`,
    'info'
  );
}

function applyI18nConfig(config: AppConfig, filePath: string): void {
  const language = config.i18n?.language;

  if (!language) {
    return;
  }

  process.env[LANGUAGE_ENV] = language;
  log(`Config loaded from ${filePath}: i18n.language=${language}`, 'info');
}

export function applyConfigFromFile(): void {
  const configPath = getConfigSearchPaths().find((p: string): boolean => fs.existsSync(p));

  if (!configPath) {
    log('No config file found. Using default behavior.', 'debug');
    return;
  }

  const config = parseConfig(configPath);
  if (!config) {
    return;
  }

  applyNumberFormatConfig(config, configPath);
  applyCurrencyFormatConfig(config, configPath);
  applyI18nConfig(config, configPath);
}
