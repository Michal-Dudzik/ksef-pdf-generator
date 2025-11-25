#!/usr/bin/env node
// Test: Invoice PDF generation with KSeF and certificate QR code
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

const TEST_NAME = 'Invoice PDF with Certificate QR Code';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-invoice-cert-output.pdf';
const NR_KSEF = 'offline';
const QR_CODE = 'offline-qr-code-data';
const CERT = 'certificate-qr-code-data';

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
  // Generate PDF with KSeF, QR code, and certificate
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice --nrKSeF "${NR_KSEF}" --qrCode "${QR_CODE}" --cert "${CERT}"`, { stdio: 'pipe' });
  
  if (!existsSync(OUTPUT_FILE)) {
    console.log(`FAIL: ${TEST_NAME} - PDF file not created`);
    process.exit(1);
  }

  console.log(`PASS: ${TEST_NAME}`);
  
  // Clean up
  try {
    unlinkSync(OUTPUT_FILE);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  process.exit(0);
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - ${error.message}`);
  try {
    if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
}

