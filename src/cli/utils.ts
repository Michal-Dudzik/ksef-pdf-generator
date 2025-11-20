import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name - works in both ESM and CJS contexts
export function getDirname(): string {
  // In CJS context (bundled), __dirname is available
  // @ts-ignore - __dirname exists in CJS context
  if (typeof __dirname !== 'undefined') {
    // @ts-ignore
    return __dirname;
  }
  // In ESM context, use import.meta.url
  // This branch won't be taken in bundled CJS
  try {
    // @ts-ignore
    const metaUrl = typeof import.meta !== 'undefined' ? import.meta.url : null;
    if (metaUrl) {
      return path.dirname(fileURLToPath(metaUrl));
    }
  } catch (e) {
    // Ignore errors
  }
  // Fallback
  return process.cwd();
}

