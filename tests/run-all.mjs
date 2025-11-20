#!/usr/bin/env node
// Test Runner - Runs all integration tests
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

console.log('========================================');
console.log('KSeF PDF Generator - Test Suite');
console.log('========================================\n');

let total = 0;
let passed = 0;
let failed = 0;
let skipped = 0;

// Get all test files
const testFiles = readdirSync('tests')
  .filter(file => file.startsWith('test-') && file.endsWith('.mjs'))
  .sort();

for (const testFile of testFiles) {
  total++;
  console.log(`\n[Test ${total}] Running ${testFile}`);
  console.log('----------------------------------------');
  
  try {
    execSync(`node ${join('tests', testFile)}`, { stdio: 'inherit' });
    passed++;
  } catch (error) {
    if (error.status === 0) {
      skipped++;
    } else {
      failed++;
    }
  }
}

console.log('\n========================================');
console.log('Test Summary');
console.log('========================================');
console.log(`Total:   ${total}`);
console.log(`Passed:  ${passed}`);
console.log(`Failed:  ${failed}`);
if (skipped > 0) console.log(`Skipped: ${skipped}`);
console.log('========================================\n');

if (failed > 0) {
  console.log('RESULT: FAILED');
  process.exit(1);
} else {
  console.log('RESULT: SUCCESS');
  process.exit(0);
}

