#!/usr/bin/env node
// Test: Error handling for invalid document type
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const TEST_NAME = 'Error: Invalid Document Type';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-invalid-type-output.pdf';
const INVALID_TYPE = 'invalid_document_type';

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

if (!existsSync(INPUT_FILE)) {
  console.log(`SKIP: Input file not found at ${INPUT_FILE}`);
  process.exit(0);
}

try {
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t ${INVALID_TYPE}`, { stdio: 'pipe' });
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

