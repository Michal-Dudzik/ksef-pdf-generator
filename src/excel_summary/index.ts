/**
 * KSeF Excel Summary Generator
 * 
 * Extracts invoice line data from KSeF XML files and exports to Excel format.
 * Includes data from FaWiersz elements and DodatkowyOpis (additional descriptions).
 */

export { parseInvoiceForExcel } from './parser';
export { exportToExcel } from './exporter';
export type { InvoiceLineData, ParsedInvoiceData, ExcelExportOptions } from './types';
