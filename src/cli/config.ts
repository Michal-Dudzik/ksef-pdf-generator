import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';

const CONFIG_FILE_NAME = 'parameters.ini';
const NUMBER_DECIMALS_ENV = 'KSEF_FORMAT_NUMBER_DECIMALS';

type AppConfig = {
  numberFormat?: {
    decimals?: number | null;
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
}
