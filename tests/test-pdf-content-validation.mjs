#!/usr/bin/env node
// Test: Validate PDF content and structure
import { execSync } from 'child_process';
import { existsSync, unlinkSync, statSync, readFileSync } from 'fs';

const TEST_NAME = 'PDF Content Validation';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-validation-output.pdf';
const MIN_PDF_SIZE = 5000; // Minimum 5KB for a valid PDF with content

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

if (!existsSync(INPUT_FILE)) {
  console.log(`SKIP: Input file not found at ${INPUT_FILE}`);
  process.exit(0);
}

// Clean up previous output
try {
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
} catch (e) {
  // Ignore
}

try {
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
  
  if (!existsSync(OUTPUT_FILE)) {
    console.log(`FAIL: ${TEST_NAME} - PDF file not created`);
    process.exit(1);
  }

  // Check file size
  const stats = statSync(OUTPUT_FILE);
  if (stats.size < MIN_PDF_SIZE) {
    console.log(`FAIL: ${TEST_NAME} - PDF too small (${stats.size} bytes), likely empty or corrupted`);
    unlinkSync(OUTPUT_FILE);
    process.exit(1);
  }

  // Check PDF header
  const buffer = readFileSync(OUTPUT_FILE);
  const header = buffer.toString('utf8', 0, 8);
  if (!header.startsWith('%PDF-')) {
    console.log(`FAIL: ${TEST_NAME} - File doesn't have valid PDF header`);
    unlinkSync(OUTPUT_FILE);
    process.exit(1);
  }

  // Check for PDF EOF marker
  const content = buffer.toString('binary');
  if (!content.includes('%%EOF')) {
    console.log(`FAIL: ${TEST_NAME} - PDF missing EOF marker, may be incomplete`);
    unlinkSync(OUTPUT_FILE);
    process.exit(1);
  }

  console.log(`PASS: ${TEST_NAME} - PDF is ${stats.size} bytes and structurally valid`);
  
  // Clean up test output
  unlinkSync(OUTPUT_FILE);
  process.exit(0);
  
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  process.exit(1);
}

