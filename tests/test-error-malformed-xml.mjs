#!/usr/bin/env node
// Test: Error handling for malformed XML
import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';

const TEST_NAME = 'Error: Malformed XML';
const EXECUTABLE = process.platform === 'win32' 
  ? 'bin\\ksef-pdf-generator.exe' 
  : 'bin/ksef-pdf-generator.sh';
const MALFORMED_XML_FILE = 'tests/malformed-test.xml';
const OUTPUT_FILE = 'tests/test-malformed-output.pdf';

console.log(`Running test: ${TEST_NAME}`);

if (!existsSync(EXECUTABLE)) {
  console.log(`FAIL: Executable not found at ${EXECUTABLE}`);
  process.exit(1);
}

// Create a malformed XML file
const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Naglowek>
    <KodFormularza>
      <!-- Missing closing tags and invalid structure -->
  </Naglowek>
`;

try {
  writeFileSync(MALFORMED_XML_FILE, malformedXML, 'utf8');
} catch (e) {
  console.log(`FAIL: ${TEST_NAME} - Could not create test file`);
  process.exit(1);
}

try {
  execSync(`${EXECUTABLE} -i "${MALFORMED_XML_FILE}" -o "${OUTPUT_FILE}" -t invoice`, { stdio: 'pipe' });
  console.log(`FAIL: ${TEST_NAME} - Command should have failed but succeeded`);
  
  // Clean up
  if (existsSync(MALFORMED_XML_FILE)) unlinkSync(MALFORMED_XML_FILE);
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  
  process.exit(1);
} catch (error) {
  // Expected to fail
  // Clean up
  if (existsSync(MALFORMED_XML_FILE)) unlinkSync(MALFORMED_XML_FILE);
  if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  
  if (error.status !== 0) {
    console.log(`PASS: ${TEST_NAME} - Correctly failed with exit code ${error.status}`);
    process.exit(0);
  } else {
    console.log(`FAIL: ${TEST_NAME} - Unexpected exit code: ${error.status}`);
    process.exit(1);
  }
}

