import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Podmiot2, Podmiot2K } from '../../types/fa1.types';
import { generatePodmiot2Podmiot2K } from './Podmiot2Podmiot2k';
import { Content } from 'pdfmake/interfaces';

vi.mock('../../../shared/PDF-functions', () => ({
  createHeader: vi.fn((label) => [{ text: `HEADER:${label}` }]),
  createLabelText: vi.fn((label, value) => ({
    text: `LABEL:${label}${value && value._text ? value._text : ''}`,
  })),
  createSubHeader: vi.fn((label) => ({ text: `SUBHEADER:${label}` })),
  verticalSpacing: vi.fn((num) => ({ text: `SPACING:${num}` })),
  getTable: vi.fn((arr) => arr || []),
  getValue: vi.fn((val) => (val && val._text ? val._text : '')),
  hasValue: vi.fn((val) => Boolean(val && val._text)),
  generateColumns: vi.fn((cols: any, opts?: any) => {
    const arr = Array.isArray(cols) ? cols : [cols];
    const columns = arr.map((c: any, idx: number) => ({
      stack: Array.isArray(c) ? [...c] : c,
      width: opts?.widths?.[idx] ?? `${(100 / arr.length).toFixed(0)}%`,
    }));
    const columnGap = opts?.columnGap ?? opts?.style?.columnGap ?? 20;
    const margin = opts?.margin ?? opts?.style?.margin;
    const style = opts?.style ?? (opts && !opts.widths && !opts.columnGap && !opts.margin ? opts : undefined);
    return {
      columns,
      columnGap,
      ...(margin ? { margin } : {}),
      ...(style ? style : {}),
    };
  }),
}));
vi.mock('./PodmiotAdres', () => ({
  generatePodmiotAdres: vi.fn((adres, label) => ({ adr: label })),
}));
vi.mock('./PodmiotDaneIdentyfikacyjne', () => ({
  generateDaneIdentyfikacyjne: vi.fn(() => [{ id: 'ID' }]),
}));
vi.mock('./PodmiotDaneKontaktowe', () => ({
  generateDaneKontaktowe: vi.fn(() => ({ contact: 'KONTAKT' })),
}));

describe('generatePodmiot2Podmiot2K', () => {
  beforeEach(() => vi.clearAllMocks());

  function hasColumns(r: unknown): r is { columns: unknown[] } {
    return (
      typeof r === 'object' &&
      r !== null &&
      'columns' in r &&
      Array.isArray((r as { columns: unknown[] }).columns)
    );
  }

  it('renders HEADER and at least one columns object', () => {
    const podmiot2: Podmiot2 = { NrEORI: { _text: 'A' } };
    const podmiot2K: Podmiot2K = {};
    const result: Content[] = generatePodmiot2Podmiot2K(podmiot2, podmiot2K);

    expect(result[0]).toEqual({ text: 'HEADER:Nabywca' });
    expect(
      result.some((r: Content) => {
        if (hasColumns(r)) {
          return Array.isArray(r.columns);
        }

        return false;
      })
    ).toBeTruthy();
  });

  it('builds firstColumn with full data', () => {
    const podmiot2: Podmiot2 = {
      NrEORI: { _text: 'EORI-X' },
      DaneIdentyfikacyjne: { NrID: { _text: 'FOO' } },
      Email: { _text: 'xx@a.pl' },
      NrKlienta: { _text: 'CUSTX' },
      Telefon: [{ _text: '600100200' }],
    };
    const podmiot2K: Podmiot2K = {};
    const result: any = generatePodmiot2Podmiot2K(podmiot2, podmiot2K);
    const firstCol: any = result.find(hasColumns)?.columns[0];

    expect(Array.isArray(firstCol.stack)).toBe(true);
    expect(firstCol.stack).toEqual(
      expect.arrayContaining([
        { text: 'SUBHEADER:Dane identyfikacyjne' },
        { text: 'LABEL:Numer EORI: EORI-X' },
        { id: 'ID' },
        { contact: 'KONTAKT' },
        { text: 'LABEL:Numer klienta: CUSTX' },
      ])
    );
  });

  it('renders "corrected content" for both cols', () => {
    const podmiot2: Podmiot2 = {
      PrefiksNabywcy: { _text: 'PN2' },
      DaneIdentyfikacyjne: { BrakID: { _text: '1' }, NrID: { _text: '123' } },
      Adres: { AdresPol: { Miasto: { _text: 'CITY' } } },
    };
    const podmiot2K: Podmiot2K = {
      PrefiksNabywcy: { _text: 'NNK' },
      DaneIdentyfikacyjne: { NrID: { _text: 'XYZ' } },
      Adres: { AdresZagr: { Kraj: { _text: 'UK' } } },
    };
    const result: any = generatePodmiot2Podmiot2K(podmiot2, podmiot2K);
    const cols: any[] = result.find(hasColumns)?.columns;

    expect(Array.isArray(cols[0].stack)).toBe(true);
    expect(Array.isArray(cols[1].stack)).toBe(true);
    expect(cols[0].stack.length).toBeGreaterThan(0);
  });

  it('ends with verticalSpacing', () => {
    const podmiot2: Podmiot2 = { NrEORI: { _text: 'END' } };
    const podmiot2K: Podmiot2K = {};
    const result: Content[] = generatePodmiot2Podmiot2K(podmiot2, podmiot2K);

    expect(result[result.length - 1]).toEqual({ text: 'SPACING:1' });
  });
});
