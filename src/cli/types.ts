export interface CliOptions {
  input: string;
  output: string;
  type: 'invoice' | 'upo';
  nrKSeF?: string;
  qrCode1?: string;
  qrCode2?: string;
}

export interface GeneratorFunctions {
  generateInvoice: any;
  generatePDFUPO: any;
}

