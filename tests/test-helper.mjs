#!/usr/bin/env node
/**
 * Test helper utilities
 * Provides a flexible command wrapper that works with both:
 * - Standalone executable (bin/ksef-pdf-generator.exe)
 * - Node script (node dist/cli.cjs)
 * 
 * Environment Variables:
 * - TEST_MODE: 'exe' or 'node' to force a specific mode
 *   Example: TEST_MODE=node npm run test:integration
 */
import { existsSync } from 'fs';

/**
 * Gets the command to run the KSeF PDF generator
 * Respects TEST_MODE environment variable to force a specific mode
 * @returns {Object} { command: string, exists: boolean, type: string }
 */
export function getCommand() {
  const exeFile = process.platform === 'win32' 
    ? 'bin\\ksef-pdf-generator.exe' 
    : 'bin/ksef-pdf-generator.sh';
  
  const nodeCli = 'dist/cli.cjs';
  const testMode = process.env.TEST_MODE?.toLowerCase();
  
  // If TEST_MODE is set, respect it
  if (testMode === 'exe') {
    if (existsSync(exeFile)) {
      return { command: exeFile, exists: true, type: 'exe' };
    } else {
      return { command: null, exists: false, type: 'exe-not-found' };
    }
  } else if (testMode === 'node' || testMode === 'cli') {
    if (existsSync(nodeCli)) {
      return { command: `node ${nodeCli}`, exists: true, type: 'node' };
    } else {
      return { command: null, exists: false, type: 'node-not-found' };
    }
  }
  
  // Auto-detect mode (prefer exe if available)
  if (existsSync(exeFile)) {
    return { command: exeFile, exists: true, type: 'exe' };
  } else if (existsSync(nodeCli)) {
    return { command: `node ${nodeCli}`, exists: true, type: 'node' };
  } else {
    return { command: null, exists: false, type: 'none' };
  }
}

/**
 * Builds a command line with arguments
 * @param {string[]} args - Command line arguments
 * @returns {string|null} Full command line or null if no executable found
 */
export function buildCommand(args = []) {
  const { command, exists } = getCommand();
  if (!exists) return null;
  
  return `${command} ${args.join(' ')}`;
}

/**
 * Gets a user-friendly description of the test mode
 * @returns {string} Description of current test mode
 */
export function getTestModeDescription() {
  const testMode = process.env.TEST_MODE?.toLowerCase();
  if (testMode === 'exe') {
    return 'Forced EXE mode (TEST_MODE=exe)';
  } else if (testMode === 'node' || testMode === 'cli') {
    return 'Forced Node mode (TEST_MODE=node)';
  } else {
    return 'Auto-detect mode';
  }
}

