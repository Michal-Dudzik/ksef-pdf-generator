import { readFile } from 'node:fs/promises';
import { xml2js } from 'xml-js';
import { stripPrefixes } from '../shared/XML-parser';
import { Faktura as Faktura3, FP } from '../lib-public/types/fa3.types';
import { InvoiceLineData, ParsedInvoiceData } from './types';

/**
 * Constants for parser
 */
const PARSER_CONSTANTS = {
  DEFAULT_CURRENCY: 'PLN',
  DEFAULT_INVOICE_NUMBER: 'UNKNOWN',
  ADDITIONAL_DATA_PREFIX: 'DodatkowyOpis_',
} as const;

/**
 * Type alias for invoice line record with FP values
 */
type InvoiceLineRecord = Record<string, FP>;

/**
 * Type alias for additional description item
 */
type AdditionalOpisItem = NonNullable<NonNullable<Faktura3['Fa']>['DodatkowyOpis']>[number];

/**
 * Extract text value from FP object
 */
function getValue(fp: FP | undefined): string | undefined {
  return fp?._text;
}

/**
 * Extract number value from FP object
 */
function getNumberValue(fp: FP | undefined): number | undefined {
  const value = getValue(fp);
  if (!value) return undefined;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Helper to safely access invoice line fields
 */
function getLineField(wiersz: unknown, field: string): FP | undefined {
  return (wiersz as InvoiceLineRecord)[field];
}

/**
 * Convert value to array if it's not already
 */
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

/**
 * Build map of additional data for invoice lines
 */
function buildAdditionalDataMap(dodatkowyOpis: AdditionalOpisItem[]) {
  const additionalDataMap = new Map<string, Map<string, string>>();
  const allAdditionalKeys = new Set<string>();
  
  for (const opis of dodatkowyOpis) {
    const nrWiersza = getValue(opis.NrWiersza);
    const klucz = getValue(opis.Klucz);
    const wartosc = getValue(opis.Wartosc);
    
    if (nrWiersza && klucz && wartosc) {
      if (!additionalDataMap.has(nrWiersza)) {
        additionalDataMap.set(nrWiersza, new Map());
      }
      additionalDataMap.get(nrWiersza)!.set(klucz, wartosc);
      allAdditionalKeys.add(klucz);
    }
  }
  
  return { additionalDataMap, allAdditionalKeys };
}

/**
 * Extract line data from invoice line element
 */
function extractLineData(wiersz: unknown, additionalDataMap: Map<string, Map<string, string>>): InvoiceLineData | null {
  const nrWiersza = getValue(getLineField(wiersz, 'NrWierszaFa'));
  
  if (!nrWiersza) return null;
  
  const lineData: InvoiceLineData = {
    NrWierszaFa: nrWiersza,
    UU_ID: getValue(getLineField(wiersz, 'UU_ID')),
    P_7: getValue(getLineField(wiersz, 'P_7')) || '',
    P_8A: getValue(getLineField(wiersz, 'P_8A')),
    P_8B: getNumberValue(getLineField(wiersz, 'P_8B')),
    P_9A: getNumberValue(getLineField(wiersz, 'P_9A')),
    P_9B: getNumberValue(getLineField(wiersz, 'P_9B')),
    P_10: getNumberValue(getLineField(wiersz, 'P_10')),
    P_11: getNumberValue(getLineField(wiersz, 'P_11')),
    P_11A: getNumberValue(getLineField(wiersz, 'P_11A')),
    P_11Vat: getNumberValue(getLineField(wiersz, 'P_11Vat')),
    P_12: getValue(getLineField(wiersz, 'P_12')),
    P_12_XII: getNumberValue(getLineField(wiersz, 'P_12_XII')),
    P_12_Zal_15: getValue(getLineField(wiersz, 'P_12_Zal_15')),
    GTIN: getValue(getLineField(wiersz, 'GTIN')),
    PKWiU: getValue(getLineField(wiersz, 'PKWiU')),
    CN: getValue(getLineField(wiersz, 'CN')),
    PKOB: getValue(getLineField(wiersz, 'PKOB')),
    KwotaAkcyzy: getValue(getLineField(wiersz, 'KwotaAkcyzy')),
    GTU: getValue(getLineField(wiersz, 'GTU')),
    Procedura: getValue(getLineField(wiersz, 'Procedura')),
    P_6A: getValue(getLineField(wiersz, 'P_6A')),
    Indeks: getValue(getLineField(wiersz, 'Indeks')),
    KursWaluty: getNumberValue(getLineField(wiersz, 'KursWaluty')),
    StanPrzed: getValue(getLineField(wiersz, 'StanPrzed')),
  };
  
  // Add additional data for this line
  const additionalData = additionalDataMap.get(nrWiersza);
  if (additionalData) {
    for (const [key, value] of additionalData.entries()) {
      lineData[`${PARSER_CONSTANTS.ADDITIONAL_DATA_PREFIX}${key}`] = value;
    }
  }
  
  return lineData;
}

/**
 * Parse invoice XML and extract line data
 */
export async function parseInvoiceForExcel(xmlPath: string): Promise<ParsedInvoiceData> {
  // Read and parse XML file
  const xmlContent = await readFile(xmlPath, 'utf-8');
  const result = xml2js(xmlContent, {
    compact: true,
    ignoreDeclaration: true,
    ignoreAttributes: false,
    ignoreComment: true,
    textKey: '_text',
  });
  
  // Strip namespace prefixes and get invoice data
  const cleanResult = stripPrefixes(result);
  const parsed = cleanResult as { Faktura: Faktura3 };
  const invoice = parsed.Faktura;
  const fa = invoice.Fa;
  
  if (!fa) {
    throw new Error('Invalid invoice structure: missing Fa element');
  }
  
  // Extract basic invoice info
  const invoiceNumber = getValue(fa.P_2) || PARSER_CONSTANTS.DEFAULT_INVOICE_NUMBER;
  const currency = getValue(fa.KodWaluty) || PARSER_CONSTANTS.DEFAULT_CURRENCY;
  
  // Extract and process lines and additional data
  const faWiersze = ensureArray(fa.FaWiersz);
  const dodatkowyOpis = ensureArray(fa.DodatkowyOpis);
  const { additionalDataMap, allAdditionalKeys } = buildAdditionalDataMap(dodatkowyOpis);
  
  // Process each line
  const lines: InvoiceLineData[] = [];
  for (const wiersz of faWiersze) {
    const lineData = extractLineData(wiersz, additionalDataMap);
    if (lineData) {
      lines.push(lineData);
    }
  }
  
  return {
    invoiceNumber,
    currency,
    lines,
    additionalDataKeys: Array.from(allAdditionalKeys),
  };
}
