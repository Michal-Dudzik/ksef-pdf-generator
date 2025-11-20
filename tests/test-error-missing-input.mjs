#!/usr/bin/env node
// Test: Error handling for missing input file
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const TEST_NAME = 'Error: Missing Input File';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const NON_EXISTENT_FILE = 'tests/non-existent-file.xml';
const OUTPUT_FILE = 'tests/test-error-output.pdf';

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

try {
  execSync(`${EXECUTABLE} -i "${NON_EXISTENT_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
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

