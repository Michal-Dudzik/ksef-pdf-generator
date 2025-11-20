import * as fs from 'fs';

const VERBOSE = process.env.KSEF_VERBOSE === '1' || process.argv.includes('--verbose');
const LOG_FILE = process.env.KSEF_LOG_FILE || '';

export { VERBOSE };

export function log(message: string, level: 'info' | 'error' | 'debug' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (level === 'error' || VERBOSE || level === 'info') {
    console.log(logMessage);
  }
  
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (err) {
      // Silently fail if we can't write to log file
    }
  }
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

