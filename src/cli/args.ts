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
      case '--watermark':
      case '--watermark-text':
        if (!nextArg) {
          console.error('Error: --watermark requires a value');
          return null;
        }
        options.watermark = nextArg;
        i++;
        break;
      case '--watermark-color':
        if (!nextArg) {
          console.error('Error: --watermark-color requires a value');
          return null;
        }
        options.watermarkColor = nextArg;
        i++;
        break;
      case '--watermark-opacity': {
        if (!nextArg) {
          console.error('Error: --watermark-opacity requires a value');
          return null;
        }
        const opacity = Number(nextArg);
        if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
          console.error('Error: --watermark-opacity must be a number between 0 and 1');
          return null;
        }
        options.watermarkOpacity = opacity;
        i++;
        break;
      }
      case '--watermark-angle': {
        if (!nextArg) {
          console.error('Error: --watermark-angle requires a value');
          return null;
        }
        const angle = Number(nextArg);
        if (!Number.isFinite(angle)) {
          console.error('Error: --watermark-angle must be a valid number');
          return null;
        }
        options.watermarkAngle = angle;
        i++;
        break;
      }
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
      case '--currencyThousandsSeparator':
      case '--currency-thousands-separator':
        options.useCurrencyThousandsSeparator = true;
        break;
      case '--mergePdf':
      case '--merge-pdf':
        if (!nextArg) {
          console.error('Error: --mergePdf requires a value');
          return null;
        }
        options.mergePdf = nextArg;
        i++;
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

  const hasWatermarkStyleOptions =
    options.watermarkColor !== undefined ||
    options.watermarkOpacity !== undefined ||
    options.watermarkAngle !== undefined;

  if (hasWatermarkStyleOptions && !options.watermark) {
    console.error('Error: watermark style options require --watermark or --watermark-text');
    return null;
  }

  return options as CliOptions;
}
