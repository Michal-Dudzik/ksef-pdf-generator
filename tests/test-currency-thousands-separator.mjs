#!/usr/bin/env node
// Test: Currency thousands separator is embedded in the generated PDF
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import zlib from 'zlib';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Currency Thousands Separator';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_WITH_SEPARATOR = 'tests/test-currency-thousands-separator.pdf';
const OUTPUT_WITHOUT_SEPARATOR = 'tests/test-currency-no-thousands-separator.pdf';
const NBSP_HEX = '<00a0>';

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

cleanup();

try {
  execSync(`${command} -i "${INPUT_FILE}" -o "${OUTPUT_WITHOUT_SEPARATOR}" -t invoice`, { stdio: 'pipe' });
  execSync(
    `${command} -i "${INPUT_FILE}" -o "${OUTPUT_WITH_SEPARATOR}" -t invoice --currencyThousandsSeparator`,
    { stdio: 'pipe' }
  );

  if (!existsSync(OUTPUT_WITHOUT_SEPARATOR) || !existsSync(OUTPUT_WITH_SEPARATOR)) {
    console.log(`FAIL: ${TEST_NAME} - Expected PDF output files were not created`);
    process.exit(1);
  }

  const withoutSeparatorContainsNbsp = extractInflatedPdfStreams(OUTPUT_WITHOUT_SEPARATOR).includes(NBSP_HEX);
  const withSeparatorContainsNbsp = extractInflatedPdfStreams(OUTPUT_WITH_SEPARATOR).includes(NBSP_HEX);

  if (withoutSeparatorContainsNbsp) {
    console.log(`FAIL: ${TEST_NAME} - PDF without separator unexpectedly contains non-breaking space glyphs`);
    process.exit(1);
  }

  if (!withSeparatorContainsNbsp) {
    console.log(`FAIL: ${TEST_NAME} - PDF with separator does not contain non-breaking space glyphs`);
    process.exit(1);
  }

  console.log(`PASS: ${TEST_NAME}`);
  process.exit(0);
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status ?? 1}`);
  process.exit(1);
} finally {
  cleanup();
}

function extractInflatedPdfStreams(filePath) {
  const pdfBuffer = readFileSync(filePath);
  const pdfContent = pdfBuffer.toString('latin1');
  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g;
  const inflatedStreams = [];

  for (const match of pdfContent.matchAll(streamPattern)) {
    const rawStream = Buffer.from(match[1], 'latin1');

    try {
      inflatedStreams.push(zlib.inflateSync(rawStream).toString('latin1'));
    } catch {
      // Ignore non-deflated streams such as embedded font binaries.
    }
  }

  return inflatedStreams.join('\n');
}

function cleanup() {
  for (const outputFile of [OUTPUT_WITH_SEPARATOR, OUTPUT_WITHOUT_SEPARATOR]) {
    try {
      if (existsSync(outputFile)) {
        unlinkSync(outputFile);
      }
    } catch {
      // Ignore cleanup failures in tests.
    }
  }
}
