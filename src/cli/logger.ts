import * as fs from 'fs';
import * as path from 'path';

const VERBOSE = process.env.KSEF_VERBOSE === '1' || process.argv.includes('--verbose');
const LOG_FILE = process.env.KSEF_LOG_FILE || '';

// Persistent log file configuration
const PERSISTENT_LOG_ENABLED = process.env.KSEF_PERSISTENT_LOG !== '0'; // Enabled by default

/**
 * Gets the default log directory (relative to executable/script location)
 */
function getDefaultLogDir(): string {
  if (process.env.KSEF_LOG_DIR) {
    return process.env.KSEF_LOG_DIR;
  }
  
  // Always use the directory where the executable/script is located
  // This ensures logs are in a predictable location regardless of CWD
  let baseDir: string = process.cwd(); // Default fallback
  
  // Check if running as a packaged executable
  const isPackaged = (process as any).pkg || (process as any).isSEA;
  
  if (isPackaged) {
    // Running as packaged executable (SEA) - use exe directory
    baseDir = path.dirname(process.execPath);
  } else {
    // Running as node script - use the directory where the main script is located
    // For built CLI (dist/cli.cjs), go up 2 levels to project root
    // __dirname in bundled code points to the dist directory
    try {
      // Try to find package.json to determine project root
      let currentDir = __dirname;
      let found = false;
      
      // Search up to 3 levels for package.json
      for (let i = 0; i < 3; i++) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
          baseDir = currentDir;
          found = true;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
      
      if (!found) {
        // Fallback: assume dist folder structure (go up 1 level from __dirname)
        baseDir = path.dirname(__dirname);
      }
    } catch (err) {
      // Final fallback: use current working directory
      baseDir = process.cwd();
    }
  }
  
  return path.join(baseDir, 'logs');
}

const PERSISTENT_LOG_DIR = getDefaultLogDir();

/**
 * Gets the log file path for the current month
 * Format: ksef-generator-YYYY-MM.log
 */
function getMonthlyLogFilePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const filename = `ksef-generator-${year}-${month}.log`;
  return path.join(PERSISTENT_LOG_DIR, filename);
}

/**
 * Cross-process lock file path used to serialize "Nr" allocation + append.
 */
function getLogLockFilePath(): string {
  return path.join(PERSISTENT_LOG_DIR, '.ksef-generator.lock');
}

export { VERBOSE };

// Session tracking
interface LogSession {
  sessionId: string;
  startTime: Date;
  parameters: any;
  type?: string;
  inputFile?: string;
  outputFile?: string;
}

let currentSession: LogSession | null = null;

/**
 * Ensures the log directory exists
 */
function ensureLogDirectory(): void {
  if (!PERSISTENT_LOG_ENABLED) return;
  
  try {
    if (!fs.existsSync(PERSISTENT_LOG_DIR)) {
      fs.mkdirSync(PERSISTENT_LOG_DIR, { recursive: true });
    }
  } catch (err) {
    // Silently fail if we can't create directory
  }
}

/**
 * Formats date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formats time as HH:MM:SS
 */
function formatTime(date: Date): string {
  // Use local time (not UTC) for human-friendly logs
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Blocking sleep without timers/async (keeps the logger API synchronous).
 */
function sleepSync(ms: number): void {
  if (ms <= 0) return;
  // Atomics.wait is the most reliable sync sleep available in Node.
  // It blocks the current thread without busy looping.
  const sab = new SharedArrayBuffer(4);
  const arr = new Int32Array(sab);
  Atomics.wait(arr, 0, 0, ms);
}

/**
 * Runs `fn` while holding a cross-process lock, to make "read max Nr -> append log"
 * effectively atomic across concurrent CLI processes.
 *
 * Without this, multiple processes can read the same max Nr before any of them append,
 * producing duplicate "Nr:" entries.
 */
function withPersistentLogLock<T>(fn: () => T): T {
  if (!PERSISTENT_LOG_ENABLED) {
    return fn();
  }

  ensureLogDirectory();

  const lockFile = getLogLockFilePath();
  const timeoutMs = Number(process.env.KSEF_LOG_LOCK_TIMEOUT_MS || 5000);
  const staleMs = Number(process.env.KSEF_LOG_LOCK_STALE_MS || 60_000);
  const startedAt = Date.now();

  let fd: number | null = null;

  while (fd === null) {
    try {
      // 'wx' => create exclusively; throws EEXIST if already present (atomic).
      fd = fs.openSync(lockFile, 'wx');
      // Store metadata for stale-lock detection.
      fs.writeFileSync(fd, `${process.pid} ${new Date().toISOString()}\n`);
    } catch (e: any) {
      if (e && e.code === 'EEXIST') {
        // Handle stale locks (process crash / forced kill)
        try {
          const stat = fs.statSync(lockFile);
          const ageMs = Date.now() - stat.mtimeMs;
          if (ageMs > staleMs) {
            fs.unlinkSync(lockFile);
            continue;
          }
        } catch {
          // If stat/unlink failed (race), just retry normally.
        }

        if (Date.now() - startedAt > timeoutMs) {
          // If we can't get the lock in time, proceed without it (best effort),
          // but keep behavior predictable (still log).
          return fn();
        }

        // Small sleep + jitter to reduce thundering herd.
        sleepSync(20 + Math.floor(Math.random() * 30));
        continue;
      }

      // Unexpected error acquiring lock: proceed without lock (best effort).
      return fn();
    }
  }

  try {
    return fn();
  } finally {
    try {
      fs.closeSync(fd);
    } catch {
      // ignore
    }
    try {
      fs.unlinkSync(lockFile);
    } catch {
      // ignore (may already be removed)
    }
  }
}

/**
 * Safely formats parameters as a single-line JSON object with spaces after `:` and `,`,
 * without touching content inside string values.
 */
function stringifyInlineJson(obj: Record<string, any>): string {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  const body = entries
    .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
    .join(', ');
  return `{${body}}`;
}

/**
 * Gets the next sequential "Nr" for the current monthly log file.
 * This is resilient across multiple CLI runs by scanning the existing log file.
 */
function getNextLogNumber(): number {
  const logFile = getMonthlyLogFilePath();

  if (!fs.existsSync(logFile)) {
    return 1;
  }

  try {
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n');

    // Scan the tail first for performance; fall back to full scan if needed.
    const tail = lines.slice(-2000);
    const candidates = [...tail, ...lines.slice(0, Math.max(0, lines.length - 2000))];

    let maxNr = 0;
    const re = /^\s*Nr:\s*(\d+)\s*$/;

    for (const line of candidates) {
      const m = re.exec(line);
      if (!m) continue;
      const nr = Number(m[1]);
      if (Number.isFinite(nr) && nr > maxNr) {
        maxNr = nr;
      }
    }

    return maxNr + 1;
  } catch {
    // If we can't read/parse, still produce a valid entry.
    return 1;
  }
}

/**
 * Writes to persistent log file
 */
function writeToPersistentLog(message: string): void {
  if (!PERSISTENT_LOG_ENABLED) return;
  
  try {
    ensureLogDirectory();
    const logFile = getMonthlyLogFilePath();
    fs.appendFileSync(logFile, message);
  } catch (err) {
    // Silently fail if we can't write to log file
  }
}

/**
 * Starts a new logging session
 */
export function startSession(parameters: any, type?: string, inputFile?: string, outputFile?: string): void {
  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  
  currentSession = {
    sessionId,
    startTime,
    parameters,
    type,
    inputFile,
    outputFile
  };
  
  log(`Session started: ${sessionId}`, 'debug');
}

/**
 * Ends the current logging session
 */
export function endSession(success: boolean, outputFile?: string, error?: any): void {
  if (!currentSession) return;
  const session = currentSession;
  
  const endTime = new Date();
  const duration = endTime.getTime() - session.startTime.getTime();
  const durationSeconds = (duration / 1000).toFixed(2);
  
  // Build command line representation
  const params = session.parameters;
  let commandLine = `ksef-pdf-generator --input ${session.inputFile || 'N/A'} --output ${session.outputFile || 'N/A'} --type ${session.type || 'unknown'}`;
  if (params.nrKSeF) {
    commandLine += ` --nrKSeF ${params.nrKSeF}`;
  }
  if (params.qrCode1) {
    commandLine += ` --qrCode1 "${params.qrCode1.length > 50 ? params.qrCode1.substring(0, 50) + '...' : params.qrCode1}"`;
  }
  if (params.qrCode2) {
    commandLine += ` --qrCode2 "${params.qrCode2.length > 50 ? params.qrCode2.substring(0, 50) + '...' : params.qrCode2}"`;
  }
  
  // Format parameters (only the relevant ones)
  const cleanParams = {
    input: params.input,
    output: params.output,
    type: params.type,
    nrKSeF: params.nrKSeF,
    qrCode1: params.qrCode1,
    qrCode2: params.qrCode2,
  };

  withPersistentLogLock(() => {
    const nr = getNextLogNumber();

    // Build consolidated session log in the requested format
    const sessionLogLines: string[] = [
      `{`,
      `    Nr: ${nr}`,
      `    Status: ${success ? 'SUCCESS' : 'FAILED'}`,
      `    Operation Time: ${formatTime(session.startTime)} - ${formatTime(endTime)} (${durationSeconds}s)`,
      ``,
      `    Parameters: ${stringifyInlineJson(cleanParams)}`,
      ``,
      `    Full command: ${commandLine}`,
    ];

    if (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      sessionLogLines.push(`    Error: ${errMsg}`);
    }

    sessionLogLines.push(`}`);

    // Separate entries with a single blank line, but do not add trailing blank lines
    const finalLog = `\n${sessionLogLines.join('\n')}\n`;

    writeToPersistentLog(finalLog);
  });

  log(`Session ended: ${session.sessionId} (${success ? 'success' : 'failed'})`, 'debug');
  
  currentSession = null;
}

/**
 * Logs a message during a session
 * Note: Session actions are not written to persistent log anymore
 * Only the consolidated session summary is written at the end
 */
export function logSessionAction(message: string, level: 'info' | 'error' | 'debug' = 'info'): void {
  // Don't write action logs to persistent file
  // Only the consolidated session log is written when session ends
  return;
}

export function log(message: string, level: 'info' | 'error' | 'debug' = 'info'): void {
  // Time-only timestamp (no date), per requirement
  const timestamp = formatTime(new Date());
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (level === 'error' || VERBOSE || level === 'info') {
    console.log(logMessage);
  }
  
  // Log to environment variable specified log file
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (err) {
      // Silently fail if we can't write to log file
    }
  }
  
  // Also log to persistent session log if in a session
  logSessionAction(message, level);
}

export function logError(message: string, error?: any): void {
  log(message, 'error');
  if (error && VERBOSE) {
    if (error instanceof Error) {
      log(`Error details: ${error.message}`, 'error');
      if (error.stack) {
        log(`Stack trace:\n${error.stack}`, 'debug');
      }
    } else {
      log(`Error details: ${JSON.stringify(error)}`, 'error');
    }
  }
}

/**
 * Gets the path to the current month's persistent log file
 */
export function getLogFilePath(): string {
  return getMonthlyLogFilePath();
}

/**
 * Checks if persistent logging is enabled
 */
export function isPersistentLogEnabled(): boolean {
  return PERSISTENT_LOG_ENABLED;
}

