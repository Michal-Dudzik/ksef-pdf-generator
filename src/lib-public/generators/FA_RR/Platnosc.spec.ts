import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePlatnosc } from './Platnosc';
import type { Platnosc, RachunekBankowy } from '../../types/FaRR.types';
import type { Content } from 'pdfmake/interfaces';
import { createHeader, createLabelText, generateTwoColumns } from '../../../shared/PDF-functions';
import { generujRachunekBankowy } from './RachunekBankowy';

vi.mock('../../../shared/PDF-functions', () => ({
  createHeader: vi.fn((text: string): Content[] => [{ text, style: 'header' }]),
  createLabelText: vi.fn((label: string, value: any): Content[] => [{ text: `${label}${value ?? ''}` }]),
  generateLine: vi.fn((): Content[] => [{ line: true } as any]),
  generateTwoColumns: vi.fn((left: any[], right: any[], margins?: number[]): Content[] => [
    { twoColumns: { left, right }, margins } as any,
  ]),
  getTable: vi.fn((data: any): any[] => data ?? []),
  getContentTable: vi.fn(() => ({ content: [{ text: 'mockTable' }] })),
  hasValue: vi.fn((value: any) =>
    !!((typeof value !== 'object' && value) || (typeof value === 'object' && value?._text)) || value === 0
  ),
  getValue: vi.fn((value: any) => (typeof value === 'object' ? value?._text : value)),
}));

vi.mock('./RachunekBankowy', () => ({
  generujRachunekBankowy: vi.fn((data: any, label: string): Content[] => [{ text: label }]),
}));
const mockedCreateLabelText = vi.mocked(createLabelText);

describe(generatePlatnosc.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dodaje informacje o formie zapłaty przelew jezeli istnieje FormaPlatnosci', () => {
    const platnosc: Partial<Platnosc> = { FormaPlatnosci: { _text: 'Przelew' } };
    const result = generatePlatnosc(platnosc as Platnosc);

    expect(createLabelText).toHaveBeenCalledWith('Forma zapłaty: ', 'Przelew');
  });

  it('dodaje informacje o formie zapłaty inna jezeli istnieje PlatnoscInna', () => {
    const platnosc: Partial<Platnosc> = { PlatnoscInna: { _text: '1' }, OpisPlatnosci: { _text: 'opis' } };
    const result = generatePlatnosc(platnosc as Platnosc);

    expect(createLabelText).toHaveBeenCalledWith('Forma zapłaty: ', 'Inna');
  });

  it('dodaje rachunki bankowe', () => {
    const platnosc: Partial<Platnosc> = {
      RachunekBankowy1: ['123'] as RachunekBankowy[],
      RachunekBankowy2: ['456'] as RachunekBankowy[],
    };

    const result: Content = generatePlatnosc(platnosc as Platnosc);

    expect(generujRachunekBankowy).toHaveBeenCalledTimes(2);
    expect(createHeader).toHaveBeenCalledWith('Płatność');
  });

  it('paruje rachunki bankowe według indeksu po obu stronach', () => {
    const farmer1 = { id: 'farmer-1' } as unknown as RachunekBankowy;
    const farmer2 = { id: 'farmer-2' } as unknown as RachunekBankowy;
    const buyer1 = { id: 'buyer-1' } as unknown as RachunekBankowy;
    const buyer2 = { id: 'buyer-2' } as unknown as RachunekBankowy;

    vi.mocked(generujRachunekBankowy)
      .mockReturnValueOnce([{ text: 'farmer-1' }] as Content[])
      .mockReturnValueOnce([{ text: 'farmer-2' }] as Content[])
      .mockReturnValueOnce([{ text: 'buyer-1' }] as Content[])
      .mockReturnValueOnce([{ text: 'buyer-2' }] as Content[]);

    generatePlatnosc({
      RachunekBankowy1: [farmer1, farmer2],
      RachunekBankowy2: [buyer1, buyer2],
    } as Platnosc);

    expect(vi.mocked(generujRachunekBankowy)).toHaveBeenCalledTimes(4);
    expect(vi.mocked(generujRachunekBankowy)).toHaveBeenNthCalledWith(1, [farmer1], 'Rachunek bankowy rolnika');
    expect(vi.mocked(generujRachunekBankowy)).toHaveBeenNthCalledWith(2, [farmer2], 'Rachunek bankowy rolnika');
    expect(vi.mocked(generujRachunekBankowy)).toHaveBeenNthCalledWith(3, [buyer1], 'Rachunek bankowy nabywcy');
    expect(vi.mocked(generujRachunekBankowy)).toHaveBeenNthCalledWith(4, [buyer2], 'Rachunek bankowy nabywcy');

    expect(generateTwoColumns).toHaveBeenCalledTimes(2);
    expect(generateTwoColumns).toHaveBeenNthCalledWith(
      1,
      [{ text: 'farmer-1' }],
      [{ text: 'buyer-1' }]
    );
    expect(generateTwoColumns).toHaveBeenNthCalledWith(
      2,
      [{ text: 'farmer-2' }],
      [{ text: 'buyer-2' }]
    );
  });

  it('zwraca pustą tablicę jeśli platnosc undefined', () => {
    const result = generatePlatnosc(undefined);

    expect(result).toEqual([]);
  });
});
