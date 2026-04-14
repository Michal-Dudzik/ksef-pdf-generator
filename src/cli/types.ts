export interface CliOptions {
  input: string;
  output: string;
  type: 'invoice' | 'upo';
  nrKSeF?: string;
  watermark?: string;
  watermarkColor?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  qrCode1?: string;
  qrCode2?: string;
  simplifiedMode?: boolean;
  mergePdf?: string;
  useCurrencyThousandsSeparator?: boolean;
}

export interface GeneratorFunctions {
  generateInvoice: any;
  generatePDFUPO: any;
}
