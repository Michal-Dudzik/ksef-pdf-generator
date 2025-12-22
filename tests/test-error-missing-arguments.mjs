#!/usr/bin/env node
// Test: Error handling for missing required arguments
import { execSync } from 'child_process';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Error: Missing Required Arguments';

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log(`FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)`);
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

let testsPassed = 0;
let testsFailed = 0;

// Test 1: No arguments at all
try {
  execSync(`${command}`, { stdio: 'pipe' });
  console.log(`  Sub-test FAIL: No arguments - should have failed`);
  testsFailed++;
} catch (error) {
  if (error.status !== 0) {
    console.log(`  Sub-test PASS: No arguments - correctly failed`);
    testsPassed++;
  }
}

// Test 2: Missing output file
try {
  execSync(`${command} -i "assets/invoice.xml" -t invoice`, { stdio: 'pipe' });
  console.log(`  Sub-test FAIL: Missing output - should have failed`);
  testsFailed++;
} catch (error) {
  if (error.status !== 0) {
    console.log(`  Sub-test PASS: Missing output - correctly failed`);
    testsPassed++;
  }
}

// Test 3: Missing document type
try {
  execSync(`${command} -i "assets/invoice.xml" -o "output.pdf"`, { stdio: 'pipe' });
  console.log(`  Sub-test FAIL: Missing type - should have failed`);
  testsFailed++;
} catch (error) {
  if (error.status !== 0) {
    console.log(`  Sub-test PASS: Missing type - correctly failed`);
    testsPassed++;
  }
}

if (testsFailed === 0) {
  console.log(`PASS: ${TEST_NAME} (${testsPassed}/${testsPassed} sub-tests passed)`);
  process.exit(0);
} else {
  console.log(`FAIL: ${TEST_NAME} (${testsPassed}/${testsPassed + testsFailed} sub-tests passed)`);
  process.exit(1);
}

