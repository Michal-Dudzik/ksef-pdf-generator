import { JSDOM } from 'jsdom';
import { log, logError } from './logger';
import type { GeneratorFunctions } from './types';

// Initialize the application asynchronously
export async function initializeApp(): Promise<GeneratorFunctions> {
  // Setup browser-like environment using jsdom
  log('Initializing jsdom environment...', 'debug');
  let dom: JSDOM;
  try {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable',
    });
    log('jsdom initialized successfully', 'debug');
  } catch (error) {
    logError('Failed to initialize jsdom', error);
    console.error('FATAL ERROR: Cannot initialize browser environment');
    console.error('This may indicate a problem with the jsdom library or its dependencies');
    process.exit(1);
  }

  // Setup global browser APIs
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true,
  });
  (global as any).Blob = dom.window.Blob;
  (global as any).File = dom.window.File;
  (global as any).FileReader = dom.window.FileReader;
  (global as any).atob = dom.window.atob;
  (global as any).btoa = dom.window.btoa;
  (global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;
  (global as any).Image = dom.window.Image;

  // Initialize pdfMake object on global for VFS registration
  let vfsData: any = null;
  const pdfMakeObj = {
    addVirtualFileSystem: (vfs: any) => {
      vfsData = vfs;
      pdfMakeObj.vfs = vfs;
    },
    vfs: null,
    fonts: null,
    tableLayouts: null
  };

  (global as any).pdfMake = pdfMakeObj;
  (dom.window as any).pdfMake = pdfMakeObj;
  (global as any).globalThis.pdfMake = pdfMakeObj;

  // Import generator functions - will be bundled together
  log('Loading PDF generator module...', 'debug');
  try {
    // Dynamic import - esbuild will bundle this inline when creating CJS bundle
    // @ts-ignore - Dynamic import of ES module
    const generatorModule = await import('../lib-public/index');
    
    log('PDF generator module loaded successfully', 'debug');
    
    return {
      generateInvoice: generatorModule.generateInvoice,
      generatePDFUPO: generatorModule.generatePDFUPO
    };
  } catch (error) {
    logError('Failed to load PDF generator module', error);
    console.error('FATAL ERROR: Cannot load PDF generator');
    console.error('File: ./index (source code version)');
    process.exit(1);
  }
}

