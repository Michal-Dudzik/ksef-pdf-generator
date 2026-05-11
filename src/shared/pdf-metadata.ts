import { TDocumentInformation } from 'pdfmake/interfaces';
import packageJson from '../../package.json';

/**
 * Field names recognized as tax/entity identifiers in KSeF XML.
 * Excludes name fields (Nazwa, PelnaNazwa, etc.) and flag fields (BrakID).
 */
const TAX_ID_FIELD_NAMES = new Set([
  'NIP',
  'NrVatUE',
  'NrID',
  'IDWewn',
  'IDWew',
  'PESEL',
  'NrEORI',
]);

/**
 * Extracts tax identifier values from a Record<string, FP>-typed DaneIdentyfikacyjne.
 * Only returns values for known identifier field names, skipping names, flags, etc.
 */
export function extractTaxIdsFromRecord(
  record: Record<string, { _text?: string } | undefined> | undefined
): string[] {
  if (!record) return [];
  return Object.entries(record)
    .filter(([key, val]) => TAX_ID_FIELD_NAMES.has(key) && val?._text)
    .map(([, val]) => val!._text!);
}

/**
 * Builds the pdfmake TDocumentInformation metadata object for a KSeF invoice PDF.
 *
 * @param rodzajFaktury - Invoice type code from RodzajFaktury (e.g. VAT, KOR, ZAL, RR).
 * @param nrKSeF       - KSeF reference number from additionalData.
 * @param sellerName   - Full name or company name of the seller (Podmiot1).
 * @param taxIdentifiers - Deduplicated list of all tax/entity identifiers found in the XML.
 */
export function generatePdfInfo(
  rodzajFaktury: string | undefined,
  nrKSeF: string | undefined,
  sellerName: string | undefined,
  taxIdentifiers: string[]
): TDocumentInformation {
  const uniqueIds = [...new Set(taxIdentifiers.filter(Boolean))];

  const titleParts: string[] = ['Faktura'];
  if (rodzajFaktury) titleParts.push(rodzajFaktury);
  if (nrKSeF) titleParts.push(nrKSeF);

  return {
    title: titleParts.join(' '),
    author: sellerName ?? '',
    keywords: uniqueIds.join(', '),
    creator: `ksef-pdf-generator/${packageJson.version}`,
    producer: `ksef-pdf-generator/${packageJson.version}`,
  };
}
