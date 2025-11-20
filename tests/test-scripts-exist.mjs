#!/usr/bin/env node
// Test: Verify that build and setup scripts exist and are readable
import { existsSync, accessSync, constants } from 'fs';

const TEST_NAME = 'Scripts Existence and Readability';

console.log(`Running test: ${TEST_NAME}`);

const scripts = process.platform === 'win32' 
  ? [
      'scripts/setup.bat',
      'scripts/build-standalone-win.bat',
      'scripts/diagnose.bat',
    ]
  : [
      'scripts/setup.sh',
    ];

let allExist = true;
let allReadable = true;

for (const script of scripts) {
  if (!existsSync(script)) {
    console.log(`  FAIL: Script not found: ${script}`);
    allExist = false;
    continue;
  }

  try {
    accessSync(script, constants.R_OK);
    console.log(`  PASS: ${script} exists and is readable`);
  } catch (err) {
    console.log(`  FAIL: ${script} exists but is not readable`);
    allReadable = false;
  }
}

if (allExist && allReadable) {
  console.log(`PASS: ${TEST_NAME} - All scripts exist and are readable`);
  process.exit(0);
} else {
  console.log(`FAIL: ${TEST_NAME} - Some scripts are missing or not readable`);
  process.exit(1);
}

