#!/usr/bin/env node
// Test: Error handling for missing input file
import { execSync } from 'child_process';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Error: Missing Input File';
const NON_EXISTENT_FILE = 'tests/non-existent-file.xml';
const OUTPUT_FILE = 'tests/test-error-output.pdf';

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log(`FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)`);
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

try {
  execSync(`${command} -i "${NON_EXISTENT_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
  console.log(`FAIL: ${TEST_NAME} - Command should have failed but succeeded`);
  process.exit(1);
} catch (error) {
  // Expected to fail
  if (error.status !== 0) {
    console.log(`PASS: ${TEST_NAME} - Correctly failed with exit code ${error.status}`);
    process.exit(0);
  } else {
    console.log(`FAIL: ${TEST_NAME} - Unexpected exit code: ${error.status}`);
    process.exit(1);
  }
}

