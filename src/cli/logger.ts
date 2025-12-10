import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
  return date.toISOString().split('T')[1].split('.')[0];
}

// Track if we've added the date header in this session
let dateHeaderAddedInThisProcess = false;

/**
 * Check if date header already exists in the log file for today
 */
function dateHeaderExistsInFile(currentDate: string): boolean {
  const logFile = getMonthlyLogFilePath();
  
  if (!fs.existsSync(logFile)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.trim().split('\n');
    
    // Look through last 200 lines for today's date header
    // This should cover even verbose sessions with many log lines
    const recentLines = lines.slice(-200);
    return recentLines.some(line => line.includes(`===== ${currentDate} =====`));
  } catch (err) {
    return false;
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
  
  const endTime = new Date();
  const duration = endTime.getTime() - currentSession.startTime.getTime();
  const durationSeconds = (duration / 1000).toFixed(2);
  
  // Build command line representation
  const params = currentSession.parameters;
  let commandLine = `ksef-pdf-generator --input ${currentSession.inputFile || 'N/A'} --output ${currentSession.outputFile || 'N/A'} --type ${currentSession.type || 'unknown'}`;
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
  
  // Build consolidated session log
  const sessionLog = [
    `${'─'.repeat(80)}`,
    `SESSION START`,
    `Session ID: ${currentSession.sessionId}`,
    ``,
    `Status: ${success ? 'SUCCESS' : 'FAILED'}`,
    `Start Time: ${formatDate(currentSession.startTime)} ${formatTime(currentSession.startTime)}`,
    `End Time: ${formatDate(endTime)} ${formatTime(endTime)}`,
    `Duration: ${durationSeconds}s`,
    ``,
    `Type: ${currentSession.type || 'unknown'}`,
    `Input File: ${currentSession.inputFile || 'N/A'}`,
    `Output File: ${currentSession.outputFile || 'N/A'}`,
    `Parameters: ${JSON.stringify(cleanParams, null, 2)}`,
    ``,
    `Full command: ${commandLine}`,
    error ? `\nError: ${error instanceof Error ? error.message : JSON.stringify(error)}` : '',
    ``,
    `SESSION END`,
    `${'─'.repeat(80)}`
  ].filter(line => line !== null && line !== undefined).join('\n');
  
  // Add date separator if this is the first session of the day
  const currentDate = formatDate(new Date());
  let finalLog = '';
  
  if (!dateHeaderAddedInThisProcess && !dateHeaderExistsInFile(currentDate)) {
    finalLog = `\n${'='.repeat(80)}\n===== ${currentDate} =====\n${'='.repeat(80)}\n\n${sessionLog}\n\n`;
    dateHeaderAddedInThisProcess = true;
  } else {
    finalLog = `\n${sessionLog}\n\n`;
  }
  
  writeToPersistentLog(finalLog);
  log(`Session ended: ${currentSession.sessionId} (${success ? 'success' : 'failed'})`, 'debug');
  
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
  const timestamp = new Date().toISOString();
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

