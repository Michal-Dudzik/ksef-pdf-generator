#!/usr/bin/env node
// Test: Error handling for invalid document type
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Error: Invalid Document Type';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-invalid-type-output.pdf';
const INVALID_TYPE = 'invalid_document_type';

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

try {
  execSync(`${command} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t ${INVALID_TYPE}`, { stdio: 'pipe' });
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

