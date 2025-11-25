import * as fs from 'fs';
import * as path from 'path';
import { getDirname } from './utils';

export function printVersion(): void {
  try {
    const packageJsonPath = path.join(getDirname(), '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`KSeF PDF Generator v${packageJson.version}`);
    console.log(`Node.js ${process.version}`);
  } catch (error) {
    console.log('KSeF PDF Generator (version unknown)');
    console.log(`Node.js ${process.version}`);
  }
}

export function printHelp(): void {
  console.log(`
KSeF PDF Generator - Command Line Tool

Usage:
  ksef-pdf-generator --input <file> --output <file> --type <invoice|upo> [options]

Required Arguments:
  --input, -i    Input XML file path
  --output, -o   Output PDF file path
  --type, -t     Type of document: "invoice" or "upo"

Optional Arguments (for invoice type):
  --nrKSeF       KSeF number for the invoice (use "OFFLINE" for offline invoices)
  --qrCode1      QR code data for the first QR code
  --qrCode2      QR code data for the second QR code (shown below the first with label "certyfikat")

Other Options:
  --help, -h     Show this help message
  --version      Show version information
  --verbose, -v  Enable verbose output

Environment Variables:
  KSEF_VERBOSE   Set to 1 for verbose output
  KSEF_LOG_FILE  Path to log file for detailed logging

Examples:
  # Generate invoice PDF
  ksef-pdf-generator --input invoice.xml --output invoice.pdf --type invoice

  # Generate invoice PDF with KSeF data (online)
  ksef-pdf-generator --input invoice.xml --output invoice.pdf --type invoice \\
    --nrKSeF "5265877635-20250808-9231003CA67B-BE" \\
    --qrCode1 "https://ksef-te.mf.gov.pl/client-app/invoice/5265877635/..."

  # Generate offline invoice PDF with certificate QR code
  ksef-pdf-generator --input invoice.xml --output invoice.pdf --type invoice \\
    --nrKSeF "OFFLINE" \\
    --qrCode1 "offline-qr-code-data" \\
    --qrCode2 "certificate-qr-code-data"

  # Generate UPO PDF
  ksef-pdf-generator --input upo.xml --output upo.pdf --type upo

  # Using short options
  ksef-pdf-generator -i invoice.xml -o invoice.pdf -t invoice

  # With verbose output
  ksef-pdf-generator -i invoice.xml -o invoice.pdf -t invoice --verbose

Diagnostics:
  For system diagnostics and troubleshooting, run:
    Windows: scripts\\diagnose.bat
    Linux:   scripts/diagnose.sh
`);
}

