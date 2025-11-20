#!/usr/bin/env node
// Test: Invoice PDF generation with KSeF number and QR code
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

const TEST_NAME = 'Invoice PDF with KSeF Data';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-invoice-ksef-output.pdf';
const KSEF_NUMBER = '5265877635-20250808-9231003CA67B-BE';
const QR_CODE = 'https://ksef-test.mf.gov.pl/client-app/invoice/test';

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
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice --nrKSeF "${KSEF_NUMBER}" --qrCode "${QR_CODE}"`, { stdio: 'pipe' });
  
  if (existsSync(OUTPUT_FILE)) {
    console.log(`PASS: ${TEST_NAME}`);
    // Clean up test output
    unlinkSync(OUTPUT_FILE);
    process.exit(0);
  } else {
    console.log(`FAIL: ${TEST_NAME} - PDF file not created`);
    process.exit(1);
  }
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  process.exit(1);
}

