#!/usr/bin/env node
// Test: CLI language argument overrides config and changes PDF labels
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import zlib from 'zlib';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Language Argument';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-language-argument.pdf';
const CONFIG_FILE = 'tests/test-language-argument.ini';
const ENGLISH_MARKER = 'ExampleText';
const POLISH_MARKER = 'Faktura podstawowa';
const UTF16_BE_DECODER = new TextDecoder('utf-16be');

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

let exitCode = 0;

try {
  writeFileSync(CONFIG_FILE, ['[i18n]', 'language = pl', ''].join('\n'));

  execSync(`${command} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice --language en`, {
    stdio: 'pipe',
    env: {
      ...process.env,
      KSEF_CONFIG_PATH: CONFIG_FILE,
    },
  });

  if (!existsSync(OUTPUT_FILE)) {
    console.log(`FAIL: ${TEST_NAME} - PDF file not created`);
    exitCode = 1;
  }

  if (existsSync(OUTPUT_FILE)) {
    const pdfText = extractPdfText(OUTPUT_FILE);

    if (!pdfText.includes(ENGLISH_MARKER)) {
      console.log(`FAIL: ${TEST_NAME} - PDF does not contain the expected English marker`);
      exitCode = 1;
    }

    if (pdfText.includes(POLISH_MARKER)) {
      console.log(`FAIL: ${TEST_NAME} - PDF still contains the Polish marker despite --language en`);
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

function cleanup() {
  for (const filePath of [OUTPUT_FILE, CONFIG_FILE]) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup failures in tests.
    }
  }
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

  const streamMatch = body.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
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
