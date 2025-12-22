#!/usr/bin/env node
// Test: Version command should display version information
import { execSync } from 'child_process';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Version Command';

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log(`FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)`);
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

try {
  execSync(`${command} --version`, { stdio: 'pipe' });
  console.log(`PASS: ${TEST_NAME}`);
  process.exit(0);
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  process.exit(1);
}

