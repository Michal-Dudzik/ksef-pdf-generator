import { readFileSync } from 'fs';
import { xml2js } from 'xml-js';
import { stripPrefixes } from '../shared/XML-parser';
import { Faktura as Faktura3, FP } from '../lib-public/types/fa3.types';
import { InvoiceLineData, ParsedInvoiceData } from './types';

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
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse invoice XML and extract line data
 */
export async function parseInvoiceForExcel(xmlPath: string): Promise<ParsedInvoiceData> {
  // Read XML file
  const xmlContent = readFileSync(xmlPath, 'utf-8');
  
  // Parse XML to object using xml-js
  const result = xml2js(xmlContent, {
    compact: true,
    ignoreDeclaration: true,
    ignoreAttributes: false,
    ignoreComment: true,
    textKey: '_text',
  });
  
  // Strip namespace prefixes
  const cleanResult = stripPrefixes(result);
  const parsed = cleanResult as { Faktura: Faktura3 };
  
  const invoice = parsed.Faktura;
  const fa = invoice.Fa;
  
  if (!fa) {
    throw new Error('Invalid invoice structure: missing Fa element');
  }
  
  // Extract basic invoice info
  const invoiceNumber = getValue(fa.P_2) || 'UNKNOWN';
  const currency = getValue(fa.KodWaluty) || 'PLN';
  
  // Extract lines from FaWiersz (ensure it's an array)
  const faWiersze = Array.isArray(fa.FaWiersz) 
    ? fa.FaWiersz 
    : fa.FaWiersz 
      ? [fa.FaWiersz] 
      : [];
  
  // Extract additional data (DodatkowyOpis, ensure it's an array)
  const dodatkowyOpis = Array.isArray(fa.DodatkowyOpis)
    ? fa.DodatkowyOpis
    : fa.DodatkowyOpis
      ? [fa.DodatkowyOpis]
      : [];
  const additionalDataMap = new Map<string, Map<string, string>>();
  const allAdditionalKeys = new Set<string>();
  
  // Build map: line number -> { key -> value }
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
  
  // Process each line
  const lines: InvoiceLineData[] = [];
  
  for (const wiersz of faWiersze) {
    const nrWiersza = getValue((wiersz as Record<string, FP>).NrWierszaFa);
    
    if (!nrWiersza) continue;
    
    const lineData: InvoiceLineData = {
      NrWierszaFa: nrWiersza,
      UU_ID: getValue((wiersz as Record<string, FP>).UU_ID),
      P_7: getValue((wiersz as Record<string, FP>).P_7) || '',
      P_8A: getValue((wiersz as Record<string, FP>).P_8A),
      P_8B: getNumberValue((wiersz as Record<string, FP>).P_8B),
      P_9A: getNumberValue((wiersz as Record<string, FP>).P_9A),
      P_9B: getNumberValue((wiersz as Record<string, FP>).P_9B),
      P_10: getNumberValue((wiersz as Record<string, FP>).P_10),
      P_11: getNumberValue((wiersz as Record<string, FP>).P_11),
      P_11A: getNumberValue((wiersz as Record<string, FP>).P_11A),
      P_11Vat: getNumberValue((wiersz as Record<string, FP>).P_11Vat),
      P_12: getValue((wiersz as Record<string, FP>).P_12),
      P_12_XII: getNumberValue((wiersz as Record<string, FP>).P_12_XII),
      P_12_Zal_15: getValue((wiersz as Record<string, FP>).P_12_Zal_15),
      GTIN: getValue((wiersz as Record<string, FP>).GTIN),
      PKWiU: getValue((wiersz as Record<string, FP>).PKWiU),
      CN: getValue((wiersz as Record<string, FP>).CN),
      PKOB: getValue((wiersz as Record<string, FP>).PKOB),
      KwotaAkcyzy: getValue((wiersz as Record<string, FP>).KwotaAkcyzy),
      GTU: getValue((wiersz as Record<string, FP>).GTU),
      Procedura: getValue((wiersz as Record<string, FP>).Procedura),
      P_6A: getValue((wiersz as Record<string, FP>).P_6A),
      Indeks: getValue((wiersz as Record<string, FP>).Indeks),
      KursWaluty: getNumberValue((wiersz as Record<string, FP>).KursWaluty),
      StanPrzed: getValue((wiersz as Record<string, FP>).StanPrzed),
    };
    
    // Add additional data for this line
    const additionalData = additionalDataMap.get(nrWiersza);
    if (additionalData) {
      for (const [key, value] of additionalData.entries()) {
        lineData[`DodatkowyOpis_${key}`] = value;
      }
    }
    
    lines.push(lineData);
  }
  
  return {
    invoiceNumber,
    currency,
    lines,
    additionalDataKeys: Array.from(allAdditionalKeys),
  };
}
