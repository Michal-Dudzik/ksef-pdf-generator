import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { applyConfigFromFile } from './config';
import { log } from './logger';

vi.mock('./logger', () => ({
  log: vi.fn(),
}));

function writeTempConfig(content: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksef-config-'));
  const configPath = path.join(tempDir, 'parameters.ini');
  fs.writeFileSync(configPath, content, 'utf-8');
  return configPath;
}

describe('applyConfigFromFile i18n config', () => {
  const originalConfigPath = process.env.KSEF_CONFIG_PATH;
  const originalLanguage = process.env.KSEF_LANGUAGE;
  const technicalInfoEnvNames = [
    'KSEF_TECHNICAL_INFO_ENABLED',
    'KSEF_TECHNICAL_INFO_GENERATED_IN',
    'KSEF_TECHNICAL_INFO_ACQUISITION_DATE',
  ] as const;
  const originalTechnicalInfoEnv = Object.fromEntries(
    technicalInfoEnvNames.map((envName: string): [string, string | undefined] => [
      envName,
      process.env[envName],
    ])
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalConfigPath === undefined) {
      delete process.env.KSEF_CONFIG_PATH;
    } else {
      process.env.KSEF_CONFIG_PATH = originalConfigPath;
    }

    if (originalLanguage === undefined) {
      delete process.env.KSEF_LANGUAGE;
    } else {
      process.env.KSEF_LANGUAGE = originalLanguage;
    }

    technicalInfoEnvNames.forEach((envName: string): void => {
      const originalValue = originalTechnicalInfoEnv[envName];
      if (originalValue === undefined) {
        delete process.env[envName];
      } else {
        process.env[envName] = originalValue;
      }
    });
  });

  it('sets KSEF_LANGUAGE from i18n.language in config file', () => {
    const configPath = writeTempConfig(`
[i18n]
language = en
`);
    process.env.KSEF_CONFIG_PATH = configPath;
    delete process.env.KSEF_LANGUAGE;

    applyConfigFromFile();

    expect(process.env.KSEF_LANGUAGE).toBe('en');
    expect(log).toHaveBeenCalledWith(`Config loaded from ${configPath}: i18n.language=en`, 'info');
  });

  it('normalizes upper-case i18n.language value', () => {
    const configPath = writeTempConfig(`
[i18n]
language = EN
`);
    process.env.KSEF_CONFIG_PATH = configPath;
    delete process.env.KSEF_LANGUAGE;

    applyConfigFromFile();

    expect(process.env.KSEF_LANGUAGE).toBe('en');
  });

  it('does not set KSEF_LANGUAGE for invalid i18n.language', () => {
    const configPath = writeTempConfig(`
[i18n]
language = de
`);
    process.env.KSEF_CONFIG_PATH = configPath;
    delete process.env.KSEF_LANGUAGE;

    applyConfigFromFile();

    expect(process.env.KSEF_LANGUAGE).toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      `Invalid "i18n.language" in ${configPath}:3. Expected one of: pl, en. Using default behavior.`,
      'error'
    );
  });

  it('sets technical information config from config file', () => {
    const configPath = writeTempConfig(`
[technicalInfo]
enabled = true
generated_in = false
acquisition_date = true
`);
    process.env.KSEF_CONFIG_PATH = configPath;

    applyConfigFromFile();

    expect(process.env.KSEF_TECHNICAL_INFO_ENABLED).toBe('true');
    expect(process.env.KSEF_TECHNICAL_INFO_GENERATED_IN).toBe('false');
    expect(process.env.KSEF_TECHNICAL_INFO_ACQUISITION_DATE).toBe('true');
  });

  it('does not set invalid technical information booleans', () => {
    const configPath = writeTempConfig(`
[technicalInfo]
acquisition_date = maybe
`);
    process.env.KSEF_CONFIG_PATH = configPath;

    applyConfigFromFile();

    expect(process.env.KSEF_TECHNICAL_INFO_ACQUISITION_DATE).toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      `Invalid "technicalInfo.acquisition_date" in ${configPath}:3. Expected boolean true/false. Using default behavior.`,
      'error'
    );
  });
});
