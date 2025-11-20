#!/usr/bin/env node
// Test: Verify proper exit codes for success and failure
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

const TEST_NAME = 'Exit Codes';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-exit-code-output.pdf';

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Success should return exit code 0
if (existsSync(INPUT_FILE)) {
  // Clean up previous output
  try {
    if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  } catch (e) {
    // Ignore
  }

  try {
    execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
    console.log(`  Sub-test PASS: Success returns exit code 0`);
    testsPassed++;
    
    // Clean up
    if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  } catch (error) {
    console.log(`  Sub-test FAIL: Success should return 0, got ${error.status}`);
    testsFailed++;
  }
} else {
  console.log(`  Sub-test SKIP: Input file not found`);
}

// Test 2: Missing file should return non-zero exit code
try {
  execSync(`${EXECUTABLE} -i "non-existent.xml" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
  console.log(`  Sub-test FAIL: Missing file should return non-zero exit code`);
  testsFailed++;
} catch (error) {
  if (error.status !== 0) {
    console.log(`  Sub-test PASS: Missing file returns exit code ${error.status}`);
    testsPassed++;
  } else {
    console.log(`  Sub-test FAIL: Expected non-zero exit code, got ${error.status}`);
    testsFailed++;
  }
}

// Test 3: Invalid arguments should return non-zero exit code
try {
  execSync(`${EXECUTABLE} --invalid-flag`, { stdio: 'pipe' });
  console.log(`  Sub-test FAIL: Invalid arguments should return non-zero exit code`);
  testsFailed++;
} catch (error) {
  if (error.status !== 0) {
    console.log(`  Sub-test PASS: Invalid arguments returns exit code ${error.status}`);
    testsPassed++;
  } else {
    console.log(`  Sub-test FAIL: Expected non-zero exit code, got ${error.status}`);
    testsFailed++;
  }
}

if (testsFailed === 0 && testsPassed > 0) {
  console.log(`PASS: ${TEST_NAME} (${testsPassed}/${testsPassed} sub-tests passed)`);
  process.exit(0);
} else {
  console.log(`FAIL: ${TEST_NAME} (${testsPassed}/${testsPassed + testsFailed} sub-tests passed)`);
  process.exit(1);
}

