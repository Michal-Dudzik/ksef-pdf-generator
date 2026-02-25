import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
import { InvoiceLineData, ParsedInvoiceData } from './types';

/**
 * Excel styling constants
 */
const EXCEL_SETTINGS = {
  ADDITIONAL_DATA_PREFIX: 'DodatkowyOpis_',
  COLUMN_WIDTH_MULTIPLIER: 10, // SheetJS uses character width units
} as const;

/**
 * Column definitions for the Excel export
 */
interface ColumnDefinition {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

/**
 * Get base column definitions
 */
function getBaseColumns(): ColumnDefinition[] {
  return [
    { header: 'Lp.', key: 'NrWierszaFa', width: 8 },
    { header: 'ID Wiersza', key: 'UU_ID', width: 20 },
    { header: 'Nazwa towaru/usługi', key: 'P_7', width: 50 },
    { header: 'Jednostka', key: 'P_8A', width: 12 },
    { header: 'Ilość', key: 'P_8B', width: 12, numFmt: '#,##0.00' },
    { header: 'Cena jedn. netto', key: 'P_9A', width: 15, numFmt: '#,##0.00' },
    { header: 'Cena jedn. brutto', key: 'P_9B', width: 15, numFmt: '#,##0.00' },
    { header: 'Rabat', key: 'P_10', width: 12, numFmt: '#,##0.00' },
    { header: 'Wartość netto', key: 'P_11', width: 15, numFmt: '#,##0.00' },
    { header: 'Wartość brutto', key: 'P_11A', width: 15, numFmt: '#,##0.00' },
    { header: 'VAT', key: 'P_11Vat', width: 12, numFmt: '#,##0.00' },
    { header: 'Stawka VAT', key: 'P_12', width: 12 },
    { header: 'Stawka OSS', key: 'P_12_XII', width: 12, numFmt: '#,##0.00' },
    { header: 'Zał. 15', key: 'P_12_Zal_15', width: 10 },
    { header: 'GTIN', key: 'GTIN', width: 18 },
    { header: 'PKWiU', key: 'PKWiU', width: 15 },
    { header: 'CN', key: 'CN', width: 12 },
    { header: 'PKOB', key: 'PKOB', width: 12 },
    { header: 'Kwota akcyzy', key: 'KwotaAkcyzy', width: 15 },
    { header: 'GTU', key: 'GTU', width: 12 },
    { header: 'Procedura', key: 'Procedura', width: 15 },
    { header: 'Data dostawy', key: 'P_6A', width: 15 },
    { header: 'Indeks', key: 'Indeks', width: 15 },
    { header: 'Kurs waluty', key: 'KursWaluty', width: 15, numFmt: '#,##0.000000' },
    { header: 'Stan przed', key: 'StanPrzed', width: 12 },
  ];
}

/**
 * Filter columns that have at least one non-empty value
 */
function filterRelevantColumns(
  columns: ColumnDefinition[],
  lines: InvoiceLineData[],
  includeAll: boolean = false
): ColumnDefinition[] {
  if (includeAll) {
    return columns;
  }
  
  return columns.filter(col => {
    // Always include these columns
    if (['NrWierszaFa', 'P_7'].includes(col.key)) {
      return true;
    }
    
    // Check if any line has a value for this column
    return lines.some(line => {
      const value = line[col.key];
      return value !== undefined && value !== null && value !== '';
    });
  });
}

/**
 * Export parsed invoice data to Excel file
 */
export async function exportToExcel(
  data: ParsedInvoiceData,
  outputPath: string,
  includeAllFields: boolean = false
): Promise<void> {
  // Prepare columns
  let columns = getBaseColumns();
  
  // Add columns for additional data
  for (const key of data.additionalDataKeys) {
    columns.push({
      header: `Dodatkowe: ${key}`,
      key: `${EXCEL_SETTINGS.ADDITIONAL_DATA_PREFIX}${key}`,
      width: 25,
    });
  }
  
  // Filter columns based on actual data
  columns = filterRelevantColumns(columns, data.lines, includeAllFields);
  
  // Create worksheet data with headers
  const worksheetData: unknown[][] = [];
  
  // Add header row
  worksheetData.push(columns.map(col => col.header));
  
  // Add data rows
  for (const line of data.lines) {
    const row: unknown[] = [];
    for (const col of columns) {
      const value = line[col.key];
      row.push(value ?? null);
    }
    worksheetData.push(row);
  }
  
  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width }));
  worksheet['!cols'] = colWidths;
  
  // Freeze first row
  worksheet['!freeze'] = {
    xSplit: "0",
    ySplit: "1",
    topLeftCell: "A2",
    activePane: "bottomLeft",
    state: "frozen"
  };
  
  // Apply number formatting to cells
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const col = columns[C];
      if (col?.numFmt) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell && typeof cell === 'object') {
          cell.z = col.numFmt;
        }
      }
    }
  }
  
  // Create metadata sheet
  const metaData = [
    ['Właściwość', 'Wartość'],
    ['Numer faktury', data.invoiceNumber],
    ['Waluta', data.currency],
    ['Liczba linii', data.lines.length],
    ['Data wygenerowania', new Date().toISOString()],
  ];
  
  const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
  metaSheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
  
  // Create workbook and add sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Linie Faktury');
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Informacje');
  
  // Write to file - use writeFileSync from Node.js for better bundling compatibility
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(outputPath, buffer);
}
