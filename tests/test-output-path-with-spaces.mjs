#!/usr/bin/env node
// Test: Handle output paths with spaces correctly
import { execSync } from 'child_process';
import { existsSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Output Path with Spaces';
const INPUT_FILE = 'assets/invoice.xml';
const TEST_DIR = 'tests/temp test dir';
const OUTPUT_FILE = join(TEST_DIR, 'test output file.pdf');

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log(`FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)`);
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

if (!existsSync(INPUT_FILE)) {
  console.log(`SKIP: Input file not found at ${INPUT_FILE}`);
  process.exit(0);
}

// Create test directory
try {
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
} catch (e) {
  console.log(`FAIL: ${TEST_NAME} - Could not create test directory`);
  process.exit(1);
}

// Clean up previous output
try {
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
} catch (e) {
  // Ignore
}

try {
  execSync(`${command} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
  
  if (existsSync(OUTPUT_FILE)) {
    console.log(`PASS: ${TEST_NAME} - PDF created with path containing spaces`);
    
    // Clean up
    unlinkSync(OUTPUT_FILE);
    rmdirSync(TEST_DIR, { recursive: true });
    process.exit(0);
  } else {
    console.log(`FAIL: ${TEST_NAME} - PDF file not created`);
    rmdirSync(TEST_DIR, { recursive: true });
    process.exit(1);
  }
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  
  // Clean up
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  if (existsSync(TEST_DIR)) rmdirSync(TEST_DIR, { recursive: true });
  
  process.exit(1);
}

