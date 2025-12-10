import * as fs from 'fs';
import * as path from 'path';
import { log, logError, VERBOSE, startSession, endSession, isPersistentLogEnabled, getLogFilePath } from './logger';
import type { CliOptions, GeneratorFunctions } from './types';
import { parseArguments } from './args';
import { initializeApp } from './init';

const LOG_FILE = process.env.KSEF_LOG_FILE || '';

export async function main(): Promise<void> {
  log('KSeF PDF Generator starting...', 'info');
  log(`Node.js version: ${process.version}`, 'debug');
  log(`Platform: ${process.platform} ${process.arch}`, 'debug');
  log(`Working directory: ${process.cwd()}`, 'debug');
  
  if (isPersistentLogEnabled()) {
    log(`Persistent logging enabled: ${getLogFilePath()}`, 'debug');
  }
  
  const options = await parseArguments();

  if (!options) {
    process.exit(1);
  }

  // Initialize the application (setup jsdom, load generator module)
  const generators = await initializeApp();

  // Start logging session with all parameters
  startSession(
    {
      input: options.input,
      output: options.output,
      type: options.type,
      nrKSeF: options.nrKSeF || null,
      qrCode1: options.qrCode1 || null,
      qrCode2: options.qrCode2 || null
    },
    options.type,
    options.input,
    options.output
  );

  try {
    log(`Command line arguments: ${JSON.stringify(options)}`, 'debug');
    
    // Check if input file exists
    if (!fs.existsSync(options.input)) {
      logError(`Input file not found: ${options.input}`);
      console.error(`Error: Input file not found: ${options.input}`);
      endSession(false, options.output, new Error(`Input file not found: ${options.input}`));
      process.exit(1);
    }
    
    log(`Input file exists: ${options.input}`, 'debug');

    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    if (outputDir && !fs.existsSync(outputDir)) {
      log(`Creating output directory: ${outputDir}`, 'debug');
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Processing ${options.type} file: ${options.input}`);
    log(`Processing ${options.type} file: ${options.input}`, 'info');

    // Read the XML file
    log('Reading XML file...', 'debug');
    const xmlContent = fs.readFileSync(options.input, 'utf-8');
    log(`XML file size: ${xmlContent.length} bytes`, 'debug');
    
    // Create a File-like object for the generator
    log('Creating File object...', 'debug');
    const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
    const file = new File([xmlBlob], path.basename(options.input), { type: 'text/xml' });

    let pdfBlob: Blob;

    if (options.type === 'invoice') {
      // Prepare additional data for invoice
      const additionalData: any = {};
      if (options.nrKSeF) {
        additionalData.nrKSeF = options.nrKSeF;
        log(`Using nrKSeF: ${options.nrKSeF}`, 'debug');
      }
      if (options.qrCode1) {
        additionalData.qrCode1 = options.qrCode1;
        log(`Using qrCode1: ${options.qrCode1}`, 'debug');
      }
      if (options.qrCode2) {
        additionalData.qrCode2 = options.qrCode2;
        log(`Using qrCode2: ${options.qrCode2}`, 'debug');
      }

      log('Generating invoice PDF...', 'info');
      pdfBlob = await generators.generateInvoice(file, additionalData, 'blob');
    } else {
      log('Generating UPO PDF...', 'info');
      pdfBlob = await generators.generatePDFUPO(file);
    }
    
    log('PDF generation completed', 'debug');

    // Convert blob to buffer and save
    const buffer = await convertBlobToBuffer(pdfBlob);
    
    log(`Writing PDF to file: ${options.output} (${buffer.length} bytes)`, 'debug');
    fs.writeFileSync(options.output, buffer);

    console.log(`✓ PDF generated successfully: ${options.output}`);
    log(`Success! Output file size: ${buffer.length} bytes`, 'info');
    
    // End session with success
    endSession(true, options.output);
    
    // Explicitly set exit code to 0 for success
    process.exitCode = 0;
    process.exit(0);
  } catch (error) {
    // End session with failure
    endSession(false, options.output, error);
    
    logError('Error generating PDF', error);
    console.error('Error generating PDF:');
    if (error instanceof Error) {
      console.error(error.message);
      if (VERBOSE && error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    
    if (!VERBOSE) {
      console.error('\nFor more details, run with --verbose flag or set KSEF_VERBOSE=1');
    }
    
    if (LOG_FILE) {
      console.error(`\nDetailed logs written to: ${LOG_FILE}`);
    }
    
    if (isPersistentLogEnabled()) {
      console.error(`\nSession logs written to: ${getLogFilePath()}`);
    }
    
    process.exit(1);
  }
}

async function convertBlobToBuffer(pdfBlob: any): Promise<Buffer> {
  log('Converting PDF blob to buffer...', 'debug');
  let buffer: Buffer;
  
  if (Buffer.isBuffer(pdfBlob)) {
    // Already a Buffer
    log('PDF blob is already a Buffer', 'debug');
    buffer = pdfBlob;
  } else if (pdfBlob instanceof Uint8Array) {
    // Uint8Array
    log('Converting Uint8Array to Buffer', 'debug');
    buffer = Buffer.from(pdfBlob);
  } else if (typeof pdfBlob === 'string') {
    // String (base64 or raw)
    log('Converting string to Buffer', 'debug');
    buffer = Buffer.from(pdfBlob, 'binary');
  } else if (pdfBlob && typeof pdfBlob === 'object') {
    // Handle jsdom Blob - use FileReader
    log('Using FileReader to convert Blob', 'debug');
    const reader = new FileReader();
    
    buffer = await new Promise<Buffer>((resolve, reject) => {
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          log(`Converted to ArrayBuffer: ${reader.result.byteLength} bytes`, 'debug');
          resolve(Buffer.from(reader.result));
        } else {
          reject(new Error('FileReader did not return ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsArrayBuffer(pdfBlob);
    });
  } else {
    const errorMsg = `Unsupported blob type: ${typeof pdfBlob}`;
    logError(errorMsg);
    throw new Error(errorMsg);
  }

  return buffer;
}

