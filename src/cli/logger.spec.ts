import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger command line formatting', () => {
  let tempLogDir: string;
  let startSession: typeof import('./logger').startSession;
  let endSession: typeof import('./logger').endSession;
  const originalLogDir = process.env.KSEF_LOG_DIR;

  beforeEach(async () => {
    tempLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksef-logger-'));
    process.env.KSEF_LOG_DIR = tempLogDir;
    process.env.KSEF_PERSISTENT_LOG = '1';
    vi.resetModules();
    const logger = await import('./logger');
    startSession = logger.startSession;
    endSession = logger.endSession;
  });

  afterEach(() => {
    if (originalLogDir === undefined) {
      delete process.env.KSEF_LOG_DIR;
    } else {
      process.env.KSEF_LOG_DIR = originalLogDir;
    }
    fs.rmSync(tempLogDir, { recursive: true, force: true });
  });

  function getLogContent(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const logFile = path.join(tempLogDir, `ksef-generator-${year}-${month}-${day}.log`);
    return fs.readFileSync(logFile, 'utf-8');
  }

  function extractFullCommand(logContent: string): string {
    const match = /Full command: (.+)/.exec(logContent);
    return match ? match[1] : '';
  }

  function runSession(ksefNumberAssignedAt: string): string {
    startSession(
      {
        input: 'in.xml',
        output: 'out.pdf',
        type: 'invoice',
        ksefNumberAssignedAt,
      },
      'invoice',
      'in.xml',
      'out.pdf'
    );
    endSession(true);
    return getLogContent();
  }

  it('keeps valid ISO dates unquoted in full command', () => {
    const log = runSession('2026-06-23');
    expect(extractFullCommand(log)).toContain('--ksefNumberAssignedAt 2026-06-23');
  });

  it('keeps ISO datetimes unquoted in full command', () => {
    const log = runSession('2026-03-19T23:31:47.543+01:00');
    expect(extractFullCommand(log)).toContain(
      '--ksefNumberAssignedAt 2026-03-19T23:31:47.543+01:00'
    );
  });

  it('quotes unsafe values so they do not add extra log lines', () => {
    const unsafeValue = '2026-06-23\ninjected';
    const log = runSession(unsafeValue);
    const fullCommand = extractFullCommand(log);

    expect(fullCommand).toBe(
      `ksef-pdf-generator --input in.xml --output out.pdf --type invoice --ksefNumberAssignedAt ${JSON.stringify(unsafeValue)}`
    );
  });
});

describe('logger default directory', () => {
  const originalExecPath = process.execPath;
  const originalLogDir = process.env.KSEF_LOG_DIR;

  afterEach(() => {
    process.execPath = originalExecPath;
    if (originalLogDir === undefined) {
      delete process.env.KSEF_LOG_DIR;
    } else {
      process.env.KSEF_LOG_DIR = originalLogDir;
    }
    vi.doUnmock('node:sea');
    vi.resetModules();
  });

  it('places logs next to a standalone SEA executable', async () => {
    const executableDir = path.join(os.tmpdir(), 'ksef-standalone');
    process.execPath = path.join(executableDir, 'ksef-pdf-generator.exe');
    delete process.env.KSEF_LOG_DIR;
    const seaModule = { isSea: () => true };
    vi.doMock('node:sea', () => ({ ...seaModule, default: seaModule }));
    vi.resetModules();

    const { getLogFilePath } = await import('./logger');

    expect(path.dirname(getLogFilePath())).toBe(path.join(executableDir, 'logs'));
  });
});

describe('logger quiet mode', () => {
  const originalArgv = [...process.argv];
  const originalQuiet = process.env.KSEF_QUIET;

  afterEach(() => {
    process.argv = [...originalArgv];
    if (originalQuiet === undefined) {
      delete process.env.KSEF_QUIET;
    } else {
      process.env.KSEF_QUIET = originalQuiet;
    }
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('suppresses informational output but keeps errors visible', async () => {
    process.argv = [originalArgv[0], originalArgv[1], '--quiet'];
    delete process.env.KSEF_QUIET;
    vi.resetModules();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { log } = await import('./logger');

    log('informational message', 'info');
    log('debug message', 'debug');
    log('error message', 'error');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] error message'));
  });
});
