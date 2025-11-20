export interface CliOptions {
  input: string;
  output: string;
  type: 'invoice' | 'upo';
  nrKSeF?: string;
  qrCode?: string;
}

export interface GeneratorFunctions {
  generateInvoice: any;
  generatePDFUPO: any;
}

