import type { CliOptions } from './types';
import { printHelp, printVersion } from './commands';

export async function parseArguments(): Promise<CliOptions | null> {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--input':
      case '-i':
        if (!nextArg) {
          console.error('Error: --input requires a value');
          return null;
        }
        options.input = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        if (!nextArg) {
          console.error('Error: --output requires a value');
          return null;
        }
        options.output = nextArg;
        i++;
        break;
      case '--type':
      case '-t':
        if (!nextArg || (nextArg !== 'invoice' && nextArg !== 'upo')) {
          console.error('Error: --type must be either "invoice" or "upo"');
          return null;
        }
        options.type = nextArg as 'invoice' | 'upo';
        i++;
        break;
      case '--nrKSeF':
        if (!nextArg) {
          console.error('Error: --nrKSeF requires a value');
          return null;
        }
        options.nrKSeF = nextArg;
        i++;
        break;
      case '--qrCode1':
        if (!nextArg) {
          console.error('Error: --qrCode1 requires a value');
          return null;
        }
        options.qrCode1 = nextArg;
        i++;
        break;
      case '--qrCode2':
        if (!nextArg) {
          console.error('Error: --qrCode2 requires a value');
          return null;
        }
        options.qrCode2 = nextArg;
        i++;
        break;
      case '--simplified':
        options.simplifiedMode = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      case '--verbose':
      case '-v':
        // Already handled in logger module, skip
        break;
      case '--version':
        printVersion();
        process.exit(0);
        break;
      default:
        console.error(`Error: Unknown option ${arg}`);
        return null;
    }
  }

  if (!options.input || !options.output || !options.type) {
    console.error('Error: Missing required arguments');
    printHelp();
    return null;
  }

  return options as CliOptions;
}

