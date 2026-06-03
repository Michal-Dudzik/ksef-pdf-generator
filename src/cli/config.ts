import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';

const CONFIG_FILE_NAME = 'parameters.ini';
const NUMBER_DECIMALS_ENV = 'KSEF_FORMAT_NUMBER_DECIMALS';
const CURRENCY_THOUSANDS_SEPARATOR_ENV = 'KSEF_FORMAT_CURRENCY_THOUSANDS_SEPARATOR';
const LANGUAGE_ENV = 'KSEF_LANGUAGE';
export const TECHNICAL_INFO_ENABLED_ENV = 'KSEF_TECHNICAL_INFO_ENABLED';
export const TECHNICAL_INFO_GENERATED_IN_ENV = 'KSEF_TECHNICAL_INFO_GENERATED_IN';
export const TECHNICAL_INFO_APP_VERSION_ENV = 'KSEF_TECHNICAL_INFO_APP_VERSION';
export const TECHNICAL_INFO_ACQUISITION_DATE_ENV = 'KSEF_TECHNICAL_INFO_ACQUISITION_DATE';
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
  technicalInfo?: {
    enabled?: boolean;
    showGeneratedIn?: boolean;
    showAppVersion?: boolean;
    showAcquisitionDate?: boolean;
  };
};

export function parseBooleanConfigValue(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

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

      const parsed = parseBooleanConfigValue(value);
      if (parsed !== undefined) {
        result.currencyFormat = { thousandsSeparator: parsed };
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

    if (section === 'technicalinfo') {
      if (key === 'enabled' || key === 'generated_in' || key === 'app_version' || key === 'acquisition_date') {
        if (!value) {
          log(
            `Invalid "technicalInfo.${key}" in ${filePath}:${lineNumber}. Expected boolean true/false. Using default behavior.`,
            'error'
          );
          continue;
        }

        const parsed = parseBooleanConfigValue(value);
        if (parsed === undefined) {
          log(
            `Invalid "technicalInfo.${key}" in ${filePath}:${lineNumber}. Expected boolean true/false. Using default behavior.`,
            'error'
          );
          continue;
        }

        result.technicalInfo = {
          ...result.technicalInfo,
          ...(key === 'enabled' ? { enabled: parsed } : {}),
          ...(key === 'generated_in' ? { showGeneratedIn: parsed } : {}),
          ...(key === 'app_version' ? { showAppVersion: parsed } : {}),
          ...(key === 'acquisition_date' ? { showAcquisitionDate: parsed } : {}),
        };
      }
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

function applyTechnicalInfoConfig(config: AppConfig, filePath: string): void {
  const technicalInfo = config.technicalInfo;

  if (!technicalInfo) {
    return;
  }

  if (technicalInfo.enabled !== undefined) {
    process.env[TECHNICAL_INFO_ENABLED_ENV] = String(technicalInfo.enabled);
    log(`Config loaded from ${filePath}: technicalInfo.enabled=${technicalInfo.enabled}`, 'info');
  }

  if (technicalInfo.showGeneratedIn !== undefined) {
    process.env[TECHNICAL_INFO_GENERATED_IN_ENV] = String(technicalInfo.showGeneratedIn);
    log(
      `Config loaded from ${filePath}: technicalInfo.generated_in=${technicalInfo.showGeneratedIn}`,
      'info'
    );
  }

  if (technicalInfo.showAppVersion !== undefined) {
    process.env[TECHNICAL_INFO_APP_VERSION_ENV] = String(technicalInfo.showAppVersion);
    log(
      `Config loaded from ${filePath}: technicalInfo.app_version=${technicalInfo.showAppVersion}`,
      'info'
    );
  }

  if (technicalInfo.showAcquisitionDate !== undefined) {
    process.env[TECHNICAL_INFO_ACQUISITION_DATE_ENV] = String(technicalInfo.showAcquisitionDate);
    log(
      `Config loaded from ${filePath}: technicalInfo.acquisition_date=${technicalInfo.showAcquisitionDate}`,
      'info'
    );
  }
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
  applyTechnicalInfoConfig(config, configPath);
}
