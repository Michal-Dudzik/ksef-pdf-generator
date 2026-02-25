#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseInvoiceForExcel } from './parser';
import { exportToExcel } from './exporter';

interface CliArgs {
  input?: string;
  output?: string;
  help?: boolean;
  version?: boolean;
  includeAll?: boolean;
  verbose?: boolean;
}

function printHelp(): void {
  console.log(`
KSeF Excel Summary Generator
============================

Usage:
  ksef-excel-summary -i <input.xml> -o <output.xlsx> [options]

Required Arguments:
  -i, --input <path>     Path to KSeF invoice XML file
  -o, --output <path>    Path to output Excel file

Options:
  --include-all          Include all fields even if empty
  --verbose              Enable verbose output
  --help                 Show this help message
  --version              Show version information

Examples:
  # Basic usage
  ksef-excel-summary -i invoice.xml -o invoice.xlsx

  # Include all fields
  ksef-excel-summary -i invoice.xml -o invoice.xlsx --include-all

  # Verbose mode
  ksef-excel-summary -i invoice.xml -o invoice.xlsx --verbose
`);
}

function printVersion(): void {
  // Using require for package.json since it's outside the TypeScript module system
  // and this is a CLI tool where dynamic require is acceptable
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const packageJson = require('../../package.json');
  console.log(`KSeF Excel Summary Generator v${packageJson.version}`);
}

async function main(): Promise<void> {
  try {
    const { values } = parseArgs({
      options: {
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
        help: { type: 'boolean' },
        version: { type: 'boolean' },
        includeAll: { type: 'boolean' },
        verbose: { type: 'boolean' },
      },
      allowPositionals: false,
    });

    const args = values as CliArgs;

    if (args.help) {
      printHelp();
      process.exit(0);
    }

    if (args.version) {
      printVersion();
      process.exit(0);
    }

    // Validate required arguments
    if (!args.input || !args.output) {
      console.error('Error: Both --input and --output arguments are required\n');
      printHelp();
      process.exit(1);
    }

    const inputPath = resolve(args.input);
    const outputPath = resolve(args.output);

    // Check if input file exists
    if (!existsSync(inputPath)) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }

    if (args.verbose) {
      console.log('KSeF Excel Summary Generator');
      console.log('============================');
      console.log(`Input:  ${inputPath}`);
      console.log(`Output: ${outputPath}`);
      console.log('');
    }

    // Parse invoice
    if (args.verbose) {
      console.log('Parsing invoice XML...');
    }
    const parsedData = await parseInvoiceForExcel(inputPath);

    if (args.verbose) {
      console.log(`Found ${parsedData.lines.length} invoice lines`);
      console.log(`Invoice number: ${parsedData.invoiceNumber}`);
      console.log(`Currency: ${parsedData.currency}`);
      if (parsedData.additionalDataKeys.length > 0) {
        console.log(`Additional data keys: ${parsedData.additionalDataKeys.join(', ')}`);
      }
      console.log('');
      console.log('Generating Excel file...');
    }

    // Export to Excel
    await exportToExcel(parsedData, outputPath, args.includeAll);

    console.log(`✓ Excel file generated successfully: ${outputPath}`);
    console.log(`  - ${parsedData.lines.length} lines exported`);
    console.log(`  - Currency: ${parsedData.currency}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
