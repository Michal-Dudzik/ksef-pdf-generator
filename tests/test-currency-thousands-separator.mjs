#!/usr/bin/env node
// Test: Currency thousands separator is embedded in the generated PDF
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import zlib from 'zlib';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Currency Thousands Separator';
const SOURCE_INPUT_FILE = 'assets/invoice.xml';
const TEST_INPUT_FILE = 'tests/test-currency-thousands-separator.xml';
const TEST_CONFIG_FILE = 'tests/test-currency-thousands-separator.ini';
const OUTPUT_WITH_SEPARATOR = 'tests/test-currency-thousands-separator.pdf';
const OUTPUT_WITHOUT_SEPARATOR = 'tests/test-currency-no-thousands-separator.pdf';
const LARGE_AMOUNT = '1234567.89';
const LARGE_AMOUNT_WITHOUT_SEPARATOR = '1234567,89 PLN';
const LARGE_AMOUNT_WITH_SEPARATOR = '1\u00A0234\u00A0567,89 PLN';
const UTF16_BE_DECODER = new TextDecoder('utf-16be');

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log(`FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)`);
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

if (!existsSync(SOURCE_INPUT_FILE)) {
  console.log(`SKIP: Input file not found at ${SOURCE_INPUT_FILE}`);
  process.exit(0);
}

cleanup();

let exitCode = 0;

try {
  prepareFixture();
  prepareConfig();

  const execOptions = {
    stdio: 'pipe',
    env: {
      ...process.env,
      KSEF_CONFIG_PATH: TEST_CONFIG_FILE,
    },
  };

  execSync(`${command} -i "${TEST_INPUT_FILE}" -o "${OUTPUT_WITHOUT_SEPARATOR}" -t invoice`, execOptions);
  execSync(
    `${command} -i "${TEST_INPUT_FILE}" -o "${OUTPUT_WITH_SEPARATOR}" -t invoice --currencyThousandsSeparator`,
    execOptions
  );

  if (!existsSync(OUTPUT_WITHOUT_SEPARATOR) || !existsSync(OUTPUT_WITH_SEPARATOR)) {
    console.log(`FAIL: ${TEST_NAME} - Expected PDF output files were not created`);
    exitCode = 1;
  }

  if (exitCode === 0) {
    const withoutSeparatorText = extractPdfText(OUTPUT_WITHOUT_SEPARATOR);
    const withSeparatorText = extractPdfText(OUTPUT_WITH_SEPARATOR);

    if (!withoutSeparatorText.includes(LARGE_AMOUNT_WITHOUT_SEPARATOR)) {
      console.log(`FAIL: ${TEST_NAME} - PDF without separator does not contain the expected compact amount`);
      exitCode = 1;
    }

    if (!withSeparatorText.includes(LARGE_AMOUNT_WITH_SEPARATOR)) {
      console.log(`FAIL: ${TEST_NAME} - PDF with separator does not contain the expected grouped amount`);
      exitCode = 1;
    }

    if (withSeparatorText.includes(LARGE_AMOUNT_WITHOUT_SEPARATOR)) {
      console.log(`FAIL: ${TEST_NAME} - PDF with separator still contains the compact amount variant`);
      exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log(`PASS: ${TEST_NAME}`);
  }
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status ?? 1}`);
  exitCode = 1;
} finally {
  cleanup();
}

process.exit(exitCode);

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
  for (const outputFile of [
    TEST_INPUT_FILE,
    TEST_CONFIG_FILE,
    OUTPUT_WITH_SEPARATOR,
    OUTPUT_WITHOUT_SEPARATOR,
  ]) {
    try {
      if (existsSync(outputFile)) {
        unlinkSync(outputFile);
      }
    } catch {
      // Ignore cleanup failures in tests.
    }
  }
}

function prepareFixture() {
  const invoiceXml = readFileSync(SOURCE_INPUT_FILE, 'utf-8');
  const fixtureXml = invoiceXml
    .replace('<P_13_1>27292.28</P_13_1>', `<P_13_1>${LARGE_AMOUNT}</P_13_1>`)
    .replace('<P_14_1>6277.22</P_14_1>', '<P_14_1>0.00</P_14_1>')
    .replace('<P_15>33569.50</P_15>', `<P_15>${LARGE_AMOUNT}</P_15>`)
    .replace('<P_9A>20.41</P_9A>', `<P_9A>${LARGE_AMOUNT}</P_9A>`)
    .replace('<P_11>20.41</P_11>', `<P_11>${LARGE_AMOUNT}</P_11>`);

  writeFileSync(TEST_INPUT_FILE, fixtureXml);
}

function prepareConfig() {
  writeFileSync(
    TEST_CONFIG_FILE,
    ['[numberFormat]', 'decimals = 2', '', '[currencyFormat]', 'thousands_separator = false', ''].join(
      '\n'
    )
  );
}

function extractPdfText(filePath) {
  const pdfContent = readFileSync(filePath).toString('latin1');
  const objects = parsePdfObjects(pdfContent);
  const pageText = [];

  for (const [objectId, body] of objects) {
    if (!/\/Type \/Page\b/.test(body)) {
      continue;
    }

    const contentsRef = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
    const resourcesRef = body.match(/\/Resources\s+(\d+)\s+0\s+R/);
    if (!contentsRef || !resourcesRef) {
      continue;
    }

    const contentStream = inflatePdfStream(objects.get(Number(contentsRef[1])));
    if (!contentStream) {
      continue;
    }

    const fontMaps = getResourceFontMaps(objects, Number(resourcesRef[1]));
    pageText.push(decodePageText(contentStream, fontMaps));
  }

  return pageText.join('\n');
}

function parsePdfObjects(pdfContent) {
  const objectPattern = /(\d+)\s+0\s+obj\s*([\s\S]*?)\s*endobj/g;
  const objects = new Map();

  for (const match of pdfContent.matchAll(objectPattern)) {
    objects.set(Number(match[1]), match[2]);
  }

  return objects;
}

function inflatePdfStream(body) {
  if (!body) {
    return null;
  }

  const streamMatch = body.match(/stream\r?\n([\s\S]*)$/);
  if (!streamMatch) {
    return null;
  }

  try {
    return zlib.inflateSync(Buffer.from(streamMatch[1], 'latin1')).toString('latin1');
  } catch {
    return null;
  }
}

function getResourceFontMaps(objects, resourceObjectId) {
  const resourceBody = objects.get(resourceObjectId) ?? '';
  const fontMaps = new Map();

  for (const fontMatch of resourceBody.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
    const fontBody = objects.get(Number(fontMatch[2]));
    const toUnicodeRef = fontBody?.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);

    if (!toUnicodeRef) {
      continue;
    }

    const toUnicodeStream = inflatePdfStream(objects.get(Number(toUnicodeRef[1])));
    fontMaps.set(fontMatch[1], parseToUnicodeCMap(toUnicodeStream ?? ''));
  }

  return fontMaps;
}

function parseToUnicodeCMap(cmapContent) {
  const cmap = new Map();

  for (const line of cmapContent.split(/\r?\n/)) {
    const rangeArrayMatch = line.match(/<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>\s+\[(.*)\]/);
    if (rangeArrayMatch) {
      const startCode = parseInt(rangeArrayMatch[1], 16);
      const endCode = parseInt(rangeArrayMatch[2], 16);
      const values = [...rangeArrayMatch[3].matchAll(/<([0-9A-Fa-f ]+)>/g)].map((valueMatch) =>
        decodeUtf16BeHex(valueMatch[1])
      );

      for (let index = 0; index <= endCode - startCode && index < values.length; index++) {
        cmap.set(startCode + index, values[index]);
      }

      continue;
    }

    const sequentialRangeMatch = line.match(/<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/);
    if (sequentialRangeMatch && !line.includes('[')) {
      const startCode = parseInt(sequentialRangeMatch[1], 16);
      const endCode = parseInt(sequentialRangeMatch[2], 16);
      const startValue = parseInt(sequentialRangeMatch[3], 16);

      for (let index = 0; index <= endCode - startCode; index++) {
        const unicodeHex = (startValue + index).toString(16).padStart(4, '0');
        cmap.set(startCode + index, decodeUtf16BeHex(unicodeHex));
      }
    }
  }

  return cmap;
}

function decodeUtf16BeHex(hex) {
  return UTF16_BE_DECODER.decode(Buffer.from(hex.replace(/\s+/g, ''), 'hex'));
}

function decodePageText(contentStream, fontMaps) {
  let currentFont = '';
  let decodedText = '';
  const textPattern = /(\/(F\d+)\s+[\d.]+\s+Tf)|(\[(.*?)\]\s*TJ)|(<([0-9A-Fa-f]+)>\s*Tj)/gs;

  for (const match of contentStream.matchAll(textPattern)) {
    if (match[2]) {
      currentFont = match[2];
      continue;
    }

    const cmap = fontMaps.get(currentFont) ?? new Map();

    if (match[4]) {
      for (const hexMatch of match[4].matchAll(/<([0-9A-Fa-f]+)>/g)) {
        decodedText += decodeGlyphHex(hexMatch[1], cmap);
      }
      continue;
    }

    if (match[6]) {
      decodedText += decodeGlyphHex(match[6], cmap);
    }
  }

  return decodedText;
}

function decodeGlyphHex(hex, cmap) {
  let decodedText = '';

  for (let index = 0; index < hex.length; index += 4) {
    const glyphCode = parseInt(hex.slice(index, index + 4), 16);
    decodedText += cmap.get(glyphCode) ?? '';
  }

  return decodedText;
}
