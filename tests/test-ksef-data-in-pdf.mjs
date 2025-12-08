#!/usr/bin/env node
// Test: Verify KSeF QR code is embedded in generated PDF
import { execSync } from 'child_process';
import { existsSync, unlinkSync, readFileSync, statSync } from 'fs';

const TEST_NAME = 'KSeF QR Code in PDF';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE_WITH_KSEF = 'tests/test-ksef-data-output.pdf';
const OUTPUT_FILE_WITHOUT_KSEF = 'tests/test-no-ksef-output.pdf';
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
  if (existsSync(OUTPUT_FILE_WITH_KSEF)) unlinkSync(OUTPUT_FILE_WITH_KSEF);
  if (existsSync(OUTPUT_FILE_WITHOUT_KSEF)) unlinkSync(OUTPUT_FILE_WITHOUT_KSEF);
} catch (e) {
  // Ignore
}

try {
  // Generate PDF without KSeF
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE_WITHOUT_KSEF}" -t invoice`, { stdio: 'pipe' });
  
  // Generate PDF with KSeF and QR code
  execSync(`${EXECUTABLE} -i "${INPUT_FILE}" -o "${OUTPUT_FILE_WITH_KSEF}" -t invoice --nrKSeF "${KSEF_NUMBER}" --qrCode1 "${QR_CODE}"`, { stdio: 'pipe' });
  
  if (!existsSync(OUTPUT_FILE_WITH_KSEF) || !existsSync(OUTPUT_FILE_WITHOUT_KSEF)) {
    console.log(`FAIL: ${TEST_NAME} - PDF files not created`);
    process.exit(1);
  }

  // Read PDF content and check for image/QR code markers
  const buffer = readFileSync(OUTPUT_FILE_WITH_KSEF);
  const content = buffer.toString('binary');
  
  // Check for PDF image objects (QR code is embedded as an image)
  const hasImageData = content.includes('/Image') || content.includes('/XObject');
  
  if (!hasImageData) {
    console.log(`FAIL: ${TEST_NAME} - No image data found in PDF (QR code should be embedded as image)`);
    unlinkSync(OUTPUT_FILE_WITH_KSEF);
    unlinkSync(OUTPUT_FILE_WITHOUT_KSEF);
    process.exit(1);
  }

  // Compare file sizes - PDF with QR code should be larger
  const sizeWithKSeF = statSync(OUTPUT_FILE_WITH_KSEF).size;
  const sizeWithoutKSeF = statSync(OUTPUT_FILE_WITHOUT_KSEF).size;
  
  if (sizeWithKSeF <= sizeWithoutKSeF) {
    console.log(`FAIL: ${TEST_NAME} - PDF with KSeF (${sizeWithKSeF} bytes) should be larger than without (${sizeWithoutKSeF} bytes)`);
    unlinkSync(OUTPUT_FILE_WITH_KSEF);
    unlinkSync(OUTPUT_FILE_WITHOUT_KSEF);
    process.exit(1);
  }

  console.log(`PASS: ${TEST_NAME} - QR code embedded (PDF with KSeF: ${sizeWithKSeF} bytes vs without: ${sizeWithoutKSeF} bytes)`);
  
  // Clean up test output
  unlinkSync(OUTPUT_FILE_WITH_KSEF);
  unlinkSync(OUTPUT_FILE_WITHOUT_KSEF);
  process.exit(0);
  
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status}`);
  if (existsSync(OUTPUT_FILE_WITH_KSEF)) unlinkSync(OUTPUT_FILE_WITH_KSEF);
  if (existsSync(OUTPUT_FILE_WITHOUT_KSEF)) unlinkSync(OUTPUT_FILE_WITHOUT_KSEF);
  process.exit(1);
}

