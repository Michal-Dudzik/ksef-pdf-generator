import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { extractTaxIdsFromRecord, generatePdfInfo } from './pdf-metadata';

// ──────────────────────────────────────────────────────────────────────────────
// extractTaxIdsFromRecord
// ──────────────────────────────────────────────────────────────────────────────

describe('extractTaxIdsFromRecord', () => {
  it('returns empty array for undefined input', () => {
    expect(extractTaxIdsFromRecord(undefined)).toEqual([]);
  });

  it('returns empty array for empty record', () => {
    expect(extractTaxIdsFromRecord({})).toEqual([]);
  });

  it('extracts NIP', () => {
    expect(extractTaxIdsFromRecord({ NIP: { _text: '1234567890' } })).toEqual(['1234567890']);
  });

  it('extracts NrVatUE', () => {
    expect(extractTaxIdsFromRecord({ NrVatUE: { _text: 'PL1234567890' } })).toEqual(['PL1234567890']);
  });

  it('extracts NrID', () => {
    expect(extractTaxIdsFromRecord({ NrID: { _text: 'DE123456789' } })).toEqual(['DE123456789']);
  });

  it('extracts IDWewn', () => {
    expect(extractTaxIdsFromRecord({ IDWewn: { _text: 'WEWN-001' } })).toEqual(['WEWN-001']);
  });

  it('extracts IDWew', () => {
    expect(extractTaxIdsFromRecord({ IDWew: { _text: 'WEW-001' } })).toEqual(['WEW-001']);
  });

  it('extracts PESEL', () => {
    expect(extractTaxIdsFromRecord({ PESEL: { _text: '12345678901' } })).toEqual(['12345678901']);
  });

  it('extracts NrEORI', () => {
    expect(extractTaxIdsFromRecord({ NrEORI: { _text: 'PL123456789000' } })).toEqual(['PL123456789000']);
  });

  it('extracts multiple identifier fields from the same record', () => {
    const result = extractTaxIdsFromRecord({
      NIP: { _text: '1111111111' },
      NrVatUE: { _text: 'PL1111111111' },
    });
    expect(result).toContain('1111111111');
    expect(result).toContain('PL1111111111');
    expect(result).toHaveLength(2);
  });

  it('skips Nazwa — name field, not a tax identifier', () => {
    expect(extractTaxIdsFromRecord({ Nazwa: { _text: 'Firma ABC' } })).toEqual([]);
  });

  it('skips PelnaNazwa — name field, not a tax identifier', () => {
    expect(extractTaxIdsFromRecord({ PelnaNazwa: { _text: 'Firma ABC sp. z o.o.' } })).toEqual([]);
  });

  it('skips NazwaHandlowa — name field, not a tax identifier', () => {
    expect(extractTaxIdsFromRecord({ NazwaHandlowa: { _text: 'Brand ABC' } })).toEqual([]);
  });

  it('skips ImiePierwsze and Nazwisko — name fields, not tax identifiers', () => {
    expect(extractTaxIdsFromRecord({
      ImiePierwsze: { _text: 'Jan' },
      Nazwisko: { _text: 'Kowalski' },
    })).toEqual([]);
  });

  it('skips BrakID — boolean flag, not a tax identifier', () => {
    expect(extractTaxIdsFromRecord({ BrakID: { _text: '1' } })).toEqual([]);
  });

  it('skips identifier fields with missing _text', () => {
    expect(extractTaxIdsFromRecord({ NIP: { _text: undefined } })).toEqual([]);
  });

  it('skips identifier fields set to undefined', () => {
    expect(extractTaxIdsFromRecord({ NIP: undefined })).toEqual([]);
  });

  it('returns only identifier fields when mixed with name and flag fields', () => {
    const result = extractTaxIdsFromRecord({
      NIP: { _text: '9876543210' },
      Nazwa: { _text: 'Firma XYZ' },
      BrakID: { _text: '1' },
      NrVatUE: { _text: 'DE999888777' },
    });
    expect(result).toContain('9876543210');
    expect(result).toContain('DE999888777');
    expect(result).not.toContain('Firma XYZ');
    expect(result).not.toContain('1');
    expect(result).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// generatePdfInfo
// ──────────────────────────────────────────────────────────────────────────────

describe('generatePdfInfo', () => {
  describe('title', () => {
    it('combines Faktura, rodzajFaktury and nrKSeF', () => {
      const info = generatePdfInfo('VAT', '20260101-SE-ABC', 'Firma', []);
      expect(info.title).toBe('Faktura VAT 20260101-SE-ABC');
    });

    it('omits nrKSeF when undefined', () => {
      const info = generatePdfInfo('VAT', undefined, 'Firma', []);
      expect(info.title).toBe('Faktura VAT');
    });

    it('omits rodzajFaktury when undefined', () => {
      const info = generatePdfInfo(undefined, '20260101-SE-ABC', 'Firma', []);
      expect(info.title).toBe('Faktura 20260101-SE-ABC');
    });

    it('falls back to just Faktura when both are undefined', () => {
      const info = generatePdfInfo(undefined, undefined, 'Firma', []);
      expect(info.title).toBe('Faktura');
    });

    it('handles all known RodzajFaktury codes', () => {
      for (const kod of ['VAT', 'KOR', 'ZAL', 'ROZ', 'KOR_ZAL', 'KOR_ROZ', 'UPR', 'RR', 'RR_KOR']) {
        const info = generatePdfInfo(kod, 'NR', 'Firma', []);
        expect(info.title).toBe(`Faktura ${kod} NR`);
      }
    });
  });

  describe('author', () => {
    it('sets author to sellerName', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Kowalski Jan', []);
      expect(info.author).toBe('Kowalski Jan');
    });

    it('sets author to empty string when sellerName is undefined', () => {
      const info = generatePdfInfo('VAT', 'NR', undefined, []);
      expect(info.author).toBe('');
    });

    it('preserves full company names with special characters', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Przedsiębiorstwo „Alfa" Sp. z o.o.', []);
      expect(info.author).toBe('Przedsiębiorstwo „Alfa" Sp. z o.o.');
    });
  });

  describe('keywords', () => {
    it('joins identifiers with comma-space separator', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', ['1234567890', 'PL9876543210']);
      expect(info.keywords).toBe('1234567890, PL9876543210');
    });

    it('deduplicates identical identifiers', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', ['1234567890', '1234567890', '9999999999']);
      expect(info.keywords).toBe('1234567890, 9999999999');
    });

    it('filters out empty-string identifiers', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', ['1234567890', '', '9999999999']);
      expect(info.keywords).toBe('1234567890, 9999999999');
    });

    it('returns empty string when no identifiers are provided', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', []);
      expect(info.keywords).toBe('');
    });

    it('handles a single identifier without trailing separator', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', ['1234567890']);
      expect(info.keywords).toBe('1234567890');
    });
  });

  describe('creator and producer', () => {
    it('sets creator to ksef-pdf-generator/{version}', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', []);
      expect(info.creator).toBe(`ksef-pdf-generator/${packageJson.version}`);
    });

    it('sets producer to ksef-pdf-generator/{version}', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', []);
      expect(info.producer).toBe(`ksef-pdf-generator/${packageJson.version}`);
    });

    it('creator and producer match each other', () => {
      const info = generatePdfInfo('KOR', 'NR', 'Firma', []);
      expect(info.creator).toBe(info.producer);
    });

    it('creator does not equal the old default pdfmake value', () => {
      const info = generatePdfInfo('VAT', 'NR', 'Firma', []);
      expect(info.creator).not.toBe('pdfmake');
      expect(info.producer).not.toBe('pdfmake');
    });
  });
});
