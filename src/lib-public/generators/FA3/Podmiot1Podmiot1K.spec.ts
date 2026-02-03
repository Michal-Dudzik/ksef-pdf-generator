import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from 'pdfmake/interfaces';
import type { Podmiot1, Podmiot1K } from '../../types/fa3.types';
import { generatePodmiot1Podmiot1K } from './Podmiot1Podmiot1K';
import { generateAdres } from './Adres';

vi.mock('../../../shared/PDF-functions', () => ({
  createHeader: vi.fn((text: string): Content[] => [{ text, style: 'header' }]),
  createLabelText: vi.fn((label: string, value: any): Content[] => [{ text: `${label}${value ?? ''}` }]),
  getTable: vi.fn((data: any) => data || []),
  formatText: vi.fn((text: string, style?: any): Content => ({ text, style })),
  verticalSpacing: vi.fn((margin: number) => ({ margin })),
  generateColumns: vi.fn((cols: Content[][], opts?: any) => {
    const arr = Array.isArray(cols) ? cols : [cols];
    const withStack = arr.map((c: any, idx: number) => {
      if (Array.isArray(c)) {
        (c as any).stack = c;
      }
      if (opts?.widths && opts.widths[idx] !== undefined) {
        (c as any).width = opts.widths[idx];
      }
      return c;
    });
    const columnGap = opts?.columnGap ?? opts?.style?.columnGap ?? 20;
    const margin = opts?.margin ?? opts?.style?.margin;
    const style = opts?.style ?? (opts && !opts.widths && !opts.columnGap && !opts.margin ? opts : undefined);
    return {
      columns: withStack,
      columnGap,
      ...(margin ? { margin } : {}),
      ...(style ? style : {}),
    };
  }),
  getValue: vi.fn((val) => val?._text || ''),
  hasValue: vi.fn((val) => Boolean(val && val._text)),
}));

vi.mock('./Adres', () => ({
  generateAdres: vi.fn((adres: any): Content[] => [{ text: 'mockAddress' }]),
}));

vi.mock('./PodmiotDaneIdentyfikacyjneTPodmiot1Dto', async () => {
  const actual = await vi.importActual('./PodmiotDaneIdentyfikacyjneTPodmiot1Dto');
  return {
    ...actual,
    generateDaneIdentyfikacyjneTPodmiot1Dto: vi.fn((data: any): Content[] => [
      { text: 'mockDaneIdentyfikacyjne' },
    ]),
  };
});

vi.mock('./PodmiotDaneKontaktowe', () => ({
  generateDaneKontaktowe: vi.fn((data: any): Content[] => [{ text: 'mockDaneKontaktowe' }]),
}));

vi.mock('./Podmiot1Podmiot1K', async () => {
  const original: any = await vi.importActual('./Podmiot1Podmiot1K');
  return {
    ...original,
    generateCorrectedContent: vi.fn((podmiot: any): Content[] => [
      { text: `mockCorrectedContent-${podmiot?.PrefiksPodatnika?._text || 'noPrefix'}` },
    ]),
  };
});

describe(generatePodmiot1Podmiot1K.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates main header and columns', () => {
    const podmiot1: Podmiot1 = { NrEORI: '123' } as any;
    const podmiot1K: Podmiot1K = {} as any;
    const result: any = generatePodmiot1Podmiot1K(podmiot1, podmiot1K);

    expect(result[0]).toEqual({ text: 'Sprzedawca', style: 'header' });
    expect(Array.isArray(result[1])).toBe(true);
    expect(result[1].length).toBeGreaterThan(0);
    expect(result[2]).toHaveProperty('columns');
    expect(Array.isArray(result[2].columns[0])).toBe(true);
    expect(result[2].columns[0].length).toBeGreaterThan(0);
    expect(result[3]).toEqual({ margin: 1 });
  });

  it('calls generateAdres if AdresKoresp exists', () => {
    const podmiot1: Podmiot1 = { NrEORI: '123', AdresKoresp: { Ulica: 'Test' } } as any;
    const podmiot1K: Podmiot1K = {} as any;
    generatePodmiot1Podmiot1K(podmiot1, podmiot1K);
    expect(generateAdres).toHaveBeenCalledWith(podmiot1.AdresKoresp);
  });

  it('handles all fields together', () => {
    const podmiot1: Podmiot1 = {
      NrEORI: '123',
      DaneIdentyfikacyjne: { NIP: '123', Nazwa: 'Firma' } as any,
      DaneKontaktowe: [{ Telefon: '123' }] as any,
      StatusInfoPodatnika: { _text: '1' },
      AdresKoresp: { Ulica: 'Test' },
    } as any;
    const podmiot1K: Podmiot1K = { PrefiksPodatnika: { _text: 'PL' } } as any;
    const result: any = generatePodmiot1Podmiot1K(podmiot1, podmiot1K);

    expect(result.length).toBe(4);
    expect(result[0]).toEqual({ text: 'Sprzedawca', style: 'header' });
    expect(result[1]).toBeInstanceOf(Array);
    expect(result[2].columns[0]).toBeInstanceOf(Array);

    expect(result[3]).toEqual({ margin: 1 });
  });

  describe('StatusInfoPodatnika handling', () => {
    it('renders status with numeric code', () => {
      const podmiot1: Podmiot1 = {
        NrEORI: '123',
        StatusInfoPodatnika: { _text: '3' },
      } as any;
    const podmiot1K: Podmiot1K = {} as any;
    const result: any = generatePodmiot1Podmiot1K(podmiot1, podmiot1K);

    const firstCol = result[1];
    // createLabelText returns array, so we need to check in nested arrays
    const hasExpectedStatus = firstCol?.some((item: any) => 
      Array.isArray(item) ? item.some((i: any) => i?.text?.includes?.('Stan upadłości')) :
        item?.text?.includes?.('Stan upadłości')
      );
      expect(hasExpectedStatus).toBeTruthy();
    });

    it('renders status with legacy text code', () => {
      const podmiot1: Podmiot1 = {
        NrEORI: '123',
        StatusInfoPodatnika: { _text: 'SAMO' },
      } as any;
    const podmiot1K: Podmiot1K = {} as any;
    const result: any = generatePodmiot1Podmiot1K(podmiot1, podmiot1K);

    const firstCol = result[1];
    const hasExpectedStatus = firstCol?.some((item: any) => 
      Array.isArray(item) ? item.some((i: any) => i?.text?.includes?.('Stan likwidacji')) :
        item?.text?.includes?.('Stan likwidacji')
      );
      expect(hasExpectedStatus).toBeTruthy();
    });

    it('does not render invalid status', () => {
      const podmiot1: Podmiot1 = {
        NrEORI: '123',
        StatusInfoPodatnika: { _text: 'xyz' },
      } as any;
    const podmiot1K: Podmiot1K = {} as any;
    const result: any = generatePodmiot1Podmiot1K(podmiot1, podmiot1K);

    const firstCol = result[1];
    const hasStatus = firstCol?.some((item: any) => 
      Array.isArray(item) ? item.some((i: any) => i?.text?.includes?.('Status podatnika')) :
        item?.text?.includes?.('Status podatnika')
      );
      expect(hasStatus).toBeFalsy();
    });
  });
});
