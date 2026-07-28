#!/usr/bin/env node
// Test: quiet mode suppresses successful command output
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'fs';
import { getCommand } from './test-helper.mjs';

const TEST_NAME = 'Quiet Mode';
const INPUT_FILE = 'assets/invoice.xml';
const OUTPUT_FILE = 'tests/test-quiet.pdf';
const ENV_OUTPUT_FILE = 'tests/test-quiet-env.pdf';
const DEFAULT_OUTPUT_FILE = 'tests/test-default-output.pdf';
const ARGUMENT_VALUE_OUTPUT_FILE = 'tests/test-quiet-argument-value.pdf';
const QUIET_LOG_DIR = 'tests/test-quiet-logs';

console.log(`Running test: ${TEST_NAME}`);

const { command, exists, type } = getCommand();
if (!exists) {
  console.log('FAIL: Executable not found (tried bin/ksef-pdf-generator.exe and node dist/cli.cjs)');
  process.exit(1);
}
console.log(`Using ${type} mode: ${command}`);

cleanup();

try {
  const isolatedEnv = {
    ...process.env,
    NODE_NO_WARNINGS: '1',
  };
  delete isolatedEnv.KSEF_QUIET;

  const output = execSync(
    `${command} -i "${INPUT_FILE}" -o "${OUTPUT_FILE}" -t invoice -q`,
    {
      encoding: 'utf8',
      env: isolatedEnv,
    }
  );

  if (output.trim() !== '') {
    console.log(`FAIL: ${TEST_NAME} - Expected empty stdout, received: ${output.trim()}`);
    process.exitCode = 1;
  } else if (!existsSync(OUTPUT_FILE)) {
    console.log(`FAIL: ${TEST_NAME} - PDF output was not created`);
    process.exitCode = 1;
  } else {
    const envOutput = execSync(
      `${command} -i "${INPUT_FILE}" -o "${ENV_OUTPUT_FILE}" -t invoice`,
      {
        encoding: 'utf8',
        env: {
          ...isolatedEnv,
          KSEF_QUIET: '1',
          KSEF_PERSISTENT_LOG: '1',
          KSEF_LOG_DIR: QUIET_LOG_DIR,
        },
      }
    );
    const quietLogFile = readdirSync(QUIET_LOG_DIR).find((fileName) =>
      fileName.startsWith('ksef-generator-')
    );
    const quietLogContent = quietLogFile
      ? readFileSync(`${QUIET_LOG_DIR}/${quietLogFile}`, 'utf8')
      : '';

    if (envOutput.trim() !== '') {
      console.log(
        `FAIL: ${TEST_NAME} - KSEF_QUIET expected empty stdout, received: ${envOutput.trim()}`
      );
      process.exitCode = 1;
    } else if (!quietLogContent.includes('"quiet": true')) {
      console.log(`FAIL: ${TEST_NAME} - Environment-enabled quiet mode was not recorded`);
      process.exitCode = 1;
    }

    const defaultOutput = execSync(
      `${command} -i "${INPUT_FILE}" -o "${DEFAULT_OUTPUT_FILE}" -t invoice`,
      {
        encoding: 'utf8',
        env: isolatedEnv,
      }
    );
    const processingMatches = defaultOutput.match(/Processing invoice file:/g) ?? [];
    const argumentValueOutput = execSync(
      `${command} -i "${INPUT_FILE}" -o "${ARGUMENT_VALUE_OUTPUT_FILE}" -t invoice --watermark -q`,
      {
        encoding: 'utf8',
        env: isolatedEnv,
      }
    );

    if (process.exitCode === 1) {
      // Preserve the earlier environment-mode failure.
    } else if (defaultOutput.includes('i18next is made possible')) {
      console.log(`FAIL: ${TEST_NAME} - i18next support notice is still visible`);
      process.exitCode = 1;
    } else if (processingMatches.length !== 1) {
      console.log(
        `FAIL: ${TEST_NAME} - Expected one processing message, received ${processingMatches.length}`
      );
      process.exitCode = 1;
    } else if (!existsSync(DEFAULT_OUTPUT_FILE)) {
      console.log(`FAIL: ${TEST_NAME} - Default-mode PDF output was not created`);
      process.exitCode = 1;
    } else if (argumentValueOutput.trim() === '') {
      console.log(`FAIL: ${TEST_NAME} - A -q option value incorrectly enabled quiet mode`);
      process.exitCode = 1;
    } else if (!existsSync(ARGUMENT_VALUE_OUTPUT_FILE)) {
      console.log(`FAIL: ${TEST_NAME} - Argument-value PDF output was not created`);
      process.exitCode = 1;
    } else {
      console.log(`PASS: ${TEST_NAME}`);
      process.exitCode = 0;
    }
  }
} catch (error) {
  console.log(`FAIL: ${TEST_NAME} - Exit code: ${error.status ?? 1}`);
  process.exitCode = 1;
} finally {
  cleanup();
}

function cleanup() {
  try {
    for (const outputFile of [
      OUTPUT_FILE,
      ENV_OUTPUT_FILE,
      DEFAULT_OUTPUT_FILE,
      ARGUMENT_VALUE_OUTPUT_FILE,
    ]) {
      if (existsSync(outputFile)) {
        unlinkSync(outputFile);
      }
    }
    if (existsSync(QUIET_LOG_DIR)) {
      rmSync(QUIET_LOG_DIR, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup failures in tests.
  }
}
