#!/usr/bin/env node

// Suppress Node.js warnings ASAP (before any imports that might trigger them)
// This must be the first code that runs
const VERBOSE = process.env.KSEF_VERBOSE === '1' || process.argv.includes('--verbose');
if (!VERBOSE && !process.env.NODE_NO_WARNINGS) {
  const originalEmit = process.emit;
  // @ts-ignore - Override emit to suppress warnings completely
  process.emit = function (event: string | symbol, ...args: any[]): boolean {
    if (event === 'warning') {
      return false; // Suppress warnings
    }
    // @ts-ignore - Call original with proper arguments
    return originalEmit.call(this, event, ...args);
  };
}

import { main } from './main';
import { logError } from './logger';

main().catch(error => {
  logError('Unhandled error in main', error);
  console.error('FATAL ERROR:', error);
  process.exit(1);
});

