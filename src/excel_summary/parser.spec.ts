import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseInvoiceForExcel } from './parser';
import * as fs from 'node:fs';

vi.mock('node:fs');

describe('parseInvoiceForExcel', () => {
  const mockXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Faktura xmlns="http://crd.gov.pl/wzor/2025/06/25/13775/">
  <Fa>
    <KodWaluty>PLN</KodWaluty>
    <P_2>TEST/001/2026</P_2>
    <FaWiersz>
      <NrWierszaFa>1</NrWierszaFa>
      <UU_ID>LINE-001</UU_ID>
      <P_7>Test Product</P_7>
      <P_8A>szt</P_8A>
      <P_8B>10</P_8B>
      <P_9A>100.00</P_9A>
      <P_11>1000.00</P_11>
      <P_12>23</P_12>
    </FaWiersz>
    <FaWiersz>
      <NrWierszaFa>2</NrWierszaFa>
      <P_7>Another Product</P_7>
      <P_8B>5</P_8B>
      <P_9A>50.00</P_9A>
      <P_11>250.00</P_11>
    </FaWiersz>
    <DodatkowyOpis>
      <NrWiersza>1</NrWiersza>
      <Klucz>INFO_A</Klucz>
      <Wartosc>Additional info for line 1</Wartosc>
    </DodatkowyOpis>
    <DodatkowyOpis>
      <NrWiersza>1</NrWiersza>
      <Klucz>INFO_B</Klucz>
      <Wartosc>More info for line 1</Wartosc>
    </DodatkowyOpis>
    <DodatkowyOpis>
      <NrWiersza>2</NrWiersza>
      <Klucz>INFO_A</Klucz>
      <Wartosc>Info for line 2</Wartosc>
    </DodatkowyOpis>
  </Fa>
</Faktura>`;

  beforeEach(() => {
    vi.mocked(fs.readFileSync).mockReturnValue(mockXmlContent);
    
    // Mock globalThis File and Blob for browser environment compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Blob = class Blob {
      constructor(public parts: unknown[], public options?: Record<string, unknown>) {}
    } as unknown as typeof Blob;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.File = class File extends Blob {
      constructor(parts: unknown[], public name: string, options?: Record<string, unknown>) {
        super(parts, options);
      }
    } as unknown as typeof File;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse invoice number and currency', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    expect(result.invoiceNumber).toBe('TEST/001/2026');
    expect(result.currency).toBe('PLN');
  });

  it('should extract all invoice lines', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].NrWierszaFa).toBe('1');
    expect(result.lines[0].P_7).toBe('Test Product');
    expect(result.lines[1].NrWierszaFa).toBe('2');
    expect(result.lines[1].P_7).toBe('Another Product');
  });

  it('should parse numeric values correctly', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    expect(result.lines[0].P_8B).toBe(10);
    expect(result.lines[0].P_9A).toBe(100);
    expect(result.lines[0].P_11).toBe(1000);
    expect(result.lines[1].P_8B).toBe(5);
    expect(result.lines[1].P_9A).toBe(50);
    expect(result.lines[1].P_11).toBe(250);
  });

  it('should map additional data to lines', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    expect(result.lines[0]['DodatkowyOpis_INFO_A']).toBe('Additional info for line 1');
    expect(result.lines[0]['DodatkowyOpis_INFO_B']).toBe('More info for line 1');
    expect(result.lines[1]['DodatkowyOpis_INFO_A']).toBe('Info for line 2');
    expect(result.lines[1]['DodatkowyOpis_INFO_B']).toBeUndefined();
  });

  it('should collect all unique additional data keys', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    expect(result.additionalDataKeys).toHaveLength(2);
    expect(result.additionalDataKeys).toContain('INFO_A');
    expect(result.additionalDataKeys).toContain('INFO_B');
  });

  it('should handle optional fields', async () => {
    const result = await parseInvoiceForExcel('test.xml');
    
    // Line 1 has unit, line 2 doesn't
    expect(result.lines[0].P_8A).toBe('szt');
    expect(result.lines[1].P_8A).toBeUndefined();
    
    // Line 1 has P_12, line 2 doesn't
    expect(result.lines[0].P_12).toBe('23');
    expect(result.lines[1].P_12).toBeUndefined();
  });

  it('should throw error for invalid invoice structure', async () => {
    const invalidXml = `<?xml version="1.0" encoding="utf-8"?>
<Faktura xmlns="http://crd.gov.pl/wzor/2025/06/25/13775/">
</Faktura>`;
    
    vi.mocked(fs.readFileSync).mockReturnValue(invalidXml);
    
    await expect(parseInvoiceForExcel('test.xml')).rejects.toThrow(
      'Invalid invoice structure: missing Fa element'
    );
  });
});
