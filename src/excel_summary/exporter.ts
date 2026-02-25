import ExcelJS from 'exceljs';
import { InvoiceLineData, ParsedInvoiceData } from './types';

/**
 * Column definitions for the Excel export
 */
interface ColumnDefinition {
  header: string;
  key: string;
  width: number;
  style?: Partial<ExcelJS.Style>;
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
    { header: 'Ilość', key: 'P_8B', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Cena jedn. netto', key: 'P_9A', width: 15, style: { numFmt: '#,##0.00' } },
    { header: 'Cena jedn. brutto', key: 'P_9B', width: 15, style: { numFmt: '#,##0.00' } },
    { header: 'Rabat', key: 'P_10', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Wartość netto', key: 'P_11', width: 15, style: { numFmt: '#,##0.00' } },
    { header: 'Wartość brutto', key: 'P_11A', width: 15, style: { numFmt: '#,##0.00' } },
    { header: 'VAT', key: 'P_11Vat', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Stawka VAT', key: 'P_12', width: 12 },
    { header: 'Stawka OSS', key: 'P_12_XII', width: 12, style: { numFmt: '#,##0.00' } },
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
    { header: 'Kurs waluty', key: 'KursWaluty', width: 15, style: { numFmt: '#,##0.000000' } },
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
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Linie Faktury');
  
  // Prepare columns
  let columns = getBaseColumns();
  
  // Add columns for additional data
  for (const key of data.additionalDataKeys) {
    columns.push({
      header: `Dodatkowe: ${key}`,
      key: `DodatkowyOpis_${key}`,
      width: 25,
    });
  }
  
  // Filter columns based on actual data
  columns = filterRelevantColumns(columns, data.lines, includeAllFields);
  
  // Set columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;
  
  // Add data rows
  for (const line of data.lines) {
    const row = worksheet.addRow(line);
    
    // Apply number formatting to cells
    columns.forEach((col, index) => {
      const cell = row.getCell(index + 1);
      if (col.style?.numFmt) {
        cell.numFmt = col.style.numFmt;
      }
    });
  }
  
  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  });
  
  // Freeze first row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];
  
  // Add metadata sheet
  const metaSheet = workbook.addWorksheet('Informacje');
  metaSheet.columns = [
    { header: 'Właściwość', key: 'property', width: 30 },
    { header: 'Wartość', key: 'value', width: 50 },
  ];
  
  metaSheet.addRow({ property: 'Numer faktury', value: data.invoiceNumber });
  metaSheet.addRow({ property: 'Waluta', value: data.currency });
  metaSheet.addRow({ property: 'Liczba linii', value: data.lines.length });
  metaSheet.addRow({ 
    property: 'Data wygenerowania', 
    value: new Date().toISOString() 
  });
  
  // Style metadata sheet
  metaSheet.getRow(1).font = { bold: true };
  metaSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };
  
  // Save file
  await workbook.xlsx.writeFile(outputPath);
}
