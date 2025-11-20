#!/usr/bin/env node
// Test: Help command should display usage information
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const TEST_NAME = 'Help Command';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

try {
  execSync(`${EXECUTABLE} --help`, { stdio: 'pipe' });
  console.log(`PASS: ${TEST_NAME}`);
  process.exit(0);
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  process.exit(1);
}

