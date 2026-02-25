/**
 * Types for Excel Summary Generator
 */

export interface InvoiceLineData {
  // Basic line information
  NrWierszaFa: string;
  UU_ID?: string;
  P_7: string; // Product/service name
  P_8A?: string; // Unit
  P_8B?: number; // Quantity
  
  // Prices
  P_9A?: number; // Unit price net
  P_9B?: number; // Unit price gross
  P_10?: number; // Discount
  P_11?: number; // Net value
  P_11A?: number; // Gross value
  P_11Vat?: number; // VAT value
  
  // Tax
  P_12?: string; // VAT rate
  P_12_XII?: number; // OSS VAT rate
  P_12_Zal_15?: string; // Attachment 15 marker
  
  // Additional fields
  GTIN?: string;
  PKWiU?: string;
  CN?: string;
  PKOB?: string;
  KwotaAkcyzy?: string;
  GTU?: string;
  Procedura?: string;
  P_6A?: string; // Delivery/execution date
  Indeks?: string;
  KursWaluty?: number; // Currency rate
  StanPrzed?: string; // State before
  
  // Additional data from DodatkowyOpis (dynamic keys)
  [key: string]: string | number | undefined;
}

export interface ParsedInvoiceData {
  invoiceNumber: string;
  currency: string;
  lines: InvoiceLineData[];
  additionalDataKeys: string[]; // List of all unique keys from DodatkowyOpis
}

export interface ExcelExportOptions {
  inputPath: string;
  outputPath: string;
  includeAllFields?: boolean; // Include fields even if they are empty in all lines
}
