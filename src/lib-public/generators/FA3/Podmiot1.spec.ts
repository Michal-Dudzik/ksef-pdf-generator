import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePodmiot1 } from './Podmiot1';
import type { Podmiot1 } from '../../types/fa3.types';
import type { Content } from 'pdfmake/interfaces';
import { createHeader, createLabelText, formatText } from '../../../shared/PDF-functions';
import { generateAdres } from './Adres';
import { generateDaneIdentyfikacyjneTPodmiot1Dto } from './PodmiotDaneIdentyfikacyjneTPodmiot1Dto';
import { generateDaneKontaktowe } from './PodmiotDaneKontaktowe';

vi.mock('../../../shared/PDF-functions', () => ({
  createHeader: vi.fn((text: string): Content[] => [{ text, style: 'header' }]),
  createLabelText: vi.fn((label: string, value: any): Content[] => [{ text: `${label}${value ?? ''}` }]),
  formatText: vi.fn((text: string, style?: any): Content => ({ text, style })),
  getValue: vi.fn((val) => val?._text || ''),
  hasValue: vi.fn((val) => Boolean(val && val._text)),
}));

vi.mock('./Adres', () => ({
  generateAdres: vi.fn((adres: any): Content[] => [{ text: 'mockAdres' }]),
}));

vi.mock('./PodmiotDaneIdentyfikacyjneTPodmiot1Dto', () => ({
  generateDaneIdentyfikacyjneTPodmiot1Dto: vi.fn((data: any): Content[] => [
    { text: 'mockDaneIdentyfikacyjne' },
  ]),
}));

vi.mock('./PodmiotDaneKontaktowe', () => ({
  generateDaneKontaktowe: vi.fn((data: any): Content[] => [{ text: 'mockDaneKontaktowe' }]),
}));

describe(generatePodmiot1.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates basic seller data', () => {
    const podmiot: Partial<Podmiot1> = {
      NrEORI: 'EORI123' as any,
      PrefiksPodatnika: 'PL' as any,
    };
    const result = generatePodmiot1(podmiot as Podmiot1);

    expect(createHeader).toHaveBeenCalledWith('Sprzedawca');
    expect(createLabelText).toHaveBeenCalledWith('Prefiks VAT: ', 'PL');
    expect(createLabelText).toHaveBeenCalledWith('Numer EORI: ', 'EORI123');
  });

  it('generates identification data if present', () => {
    const podmiot: Partial<Podmiot1> = {
      DaneIdentyfikacyjne: { NIP: { _text: 'nip' }, Nazwa: { _text: 'Nazwa' } },
    };
    const result = generatePodmiot1(podmiot as Podmiot1);

    expect(generateDaneIdentyfikacyjneTPodmiot1Dto).toHaveBeenCalledWith({
      NIP: { _text: 'nip' },
      Nazwa: { _text: 'Nazwa' },
    });
    expect(result.some((c) => (c as any).text === 'mockDaneIdentyfikacyjne')).toBe(true);
  });

  it('generates address and correspondence address', () => {
    const podmiot: Partial<Podmiot1> = {
      Adres: { KodKraju: { _text: 'Ulica 1' } },
      AdresKoresp: { KodKraju: { _text: 'Ulica 2' } },
    };
    const result = generatePodmiot1(podmiot as Podmiot1);

    expect(generateAdres).toHaveBeenCalledWith({ KodKraju: { _text: 'Ulica 1' } });
    expect(generateAdres).toHaveBeenCalledWith({ KodKraju: { _text: 'Ulica 2' } });
    expect(result.some((c) => (c as any).text === 'mockAdres')).toBe(true);
    expect(formatText).toHaveBeenCalledWith('Adres', ['Label', 'LabelMargin']);
    expect(formatText).toHaveBeenCalledWith('Adres do korespondencji', ['Label', 'LabelMargin']);
  });

  it('generates contact data', () => {
    const podmiot: Partial<Podmiot1> = {
      DaneKontaktowe: [{ Telefon: { _text: '123' } }],
      StatusInfoPodatnika: { _text: '4' },
    };
    const result = generatePodmiot1(podmiot as Podmiot1);

    expect(generateDaneKontaktowe).toHaveBeenCalledWith([{ Telefon: { _text: '123' } }]);
    expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', 'Przedsiębiorstwo w spadku');
    expect(result.some((c) => (c as any).text === 'mockDaneKontaktowe')).toBe(true);
  });

  it('generates taxpayer status', () => {
    const podmiot: Partial<Podmiot1> = {
      StatusInfoPodatnika: { _text: '1' },
    };
    const result = generatePodmiot1(podmiot as Podmiot1);

    expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', 'Stan likwidacji');
    expect(result.some((c) => (c as any).text === 'mockDaneKontaktowe')).toBe(false);
  });

  describe('StatusInfoPodatnika - comprehensive tests', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('handles all numeric status codes correctly', () => {
      const testCases = [
        { code: '1', expected: 'Stan likwidacji' },
        { code: '2', expected: 'Postępowanie restrukturyzacyjne' },
        { code: '3', expected: 'Stan upadłości' },
        { code: '4', expected: 'Przedsiębiorstwo w spadku' },
      ];

      testCases.forEach(({ code, expected }) => {
        vi.clearAllMocks();
        const podmiot: Partial<Podmiot1> = {
          StatusInfoPodatnika: { _text: code },
        };
        const result = generatePodmiot1(podmiot as Podmiot1);

        expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', expected);
      });
    });

    it('handles legacy text values with backward compatibility', () => {
      const testCases = [
        { legacyValue: 'SAMO', expected: 'Stan likwidacji' },
        { legacyValue: 'zarejestrowany', expected: 'Postępowanie restrukturyzacyjne' },
        { legacyValue: 'stan upadłości', expected: 'Stan upadłości' },
        { legacyValue: 'przedsiębiorstwo w spadku', expected: 'Przedsiębiorstwo w spadku' },
      ];

      testCases.forEach(({ legacyValue, expected }) => {
        vi.clearAllMocks();
        const podmiot: Partial<Podmiot1> = {
          StatusInfoPodatnika: { _text: legacyValue },
        };
        const result = generatePodmiot1(podmiot as Podmiot1);

        expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', expected);
      });
    });

    it('handles undefined StatusInfoPodatnika gracefully', () => {
      const podmiot: Partial<Podmiot1> = {
        StatusInfoPodatnika: undefined,
      };
      const result = generatePodmiot1(podmiot as Podmiot1);

      const statusCalls = (createLabelText as any).mock.calls.filter((call: any[]) =>
        call[0]?.includes('Status podatnika')
      );
      expect(statusCalls).toHaveLength(0);
    });

    it('handles null/empty StatusInfoPodatnika gracefully', () => {
      const podmiot: Partial<Podmiot1> = {
        StatusInfoPodatnika: { _text: '' },
      };
      const result = generatePodmiot1(podmiot as Podmiot1);

      const statusCalls = (createLabelText as any).mock.calls.filter((call: any[]) =>
        call[0]?.includes('Status podatnika')
      );
      expect(statusCalls).toHaveLength(0);
    });

    it('handles unexpected status codes gracefully', () => {
      const podmiot: Partial<Podmiot1> = {
        StatusInfoPodatnika: { _text: 'some_invalid_value' },
      };
      const result = generatePodmiot1(podmiot as Podmiot1);

      const statusCalls = (createLabelText as any).mock.calls.filter((call: any[]) =>
        call[0]?.includes('Status podatnika')
      );
      expect(statusCalls).toHaveLength(0);
    });

    it('handles whitespace in status codes', () => {
      const podmiot: Partial<Podmiot1> = {
        StatusInfoPodatnika: { _text: '  2  ' },
      };
      const result = generatePodmiot1(podmiot as Podmiot1);

      expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', 'Postępowanie restrukturyzacyjne');
    });

    it('handles case-insensitive legacy values', () => {
      const podmiot: Partial<Podmiot1> = {
        StatusInfoPodatnika: { _text: 'ZAREJESTROWANY' },
      };
      const result = generatePodmiot1(podmiot as Podmiot1);

      expect(createLabelText).toHaveBeenCalledWith('Status podatnika: ', 'Postępowanie restrukturyzacyjne');
    });
  });
});
