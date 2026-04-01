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
  const farmerAccount: RachunekBankowy = {
    NrRB: { _text: '12345678901234567890123456' },
    SWIFT: { _text: 'BPKOPLPW' },
    NazwaBanku: { _text: 'PKO Bank Polski' },
    OpisRachunku: { _text: 'Rachunek rolnika' },
  };

  const buyerAccount: RachunekBankowy = {
    NrRB: { _text: '65432109876543210987654321' },
    SWIFT: { _text: 'BREXPLPW' },
    NazwaBanku: { _text: 'mBank' },
    OpisRachunku: { _text: 'Rachunek nabywcy' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dodaje informacje o formie zapłaty przelew jezeli istnieje FormaPlatnosci', () => {
    const platnosc: Partial<Platnosc> = { FormaPlatnosci: { _text: 'Przelew' } };
    const result = generatePlatnosc(platnosc as Platnosc);

    expect(createLabelText).toHaveBeenCalledWith('Forma zapłaty: ', 'Przelew');
  });

  it('dodaje informacje o formie zapłaty inna jezeli istnieje OpisPlatnosci', () => {
    const platnosc: Partial<Platnosc> = { OpisPlatnosci: { _text: 'opis' } };
    generatePlatnosc(platnosc as Platnosc);

    expect(createLabelText).toHaveBeenCalledWith('Forma zapłaty: ', 'Inna');
    expect(createLabelText).toHaveBeenCalledWith('Opis: ', 'opis');
  });

  it('dodaje rachunki bankowe', () => {
    const platnosc: Partial<Platnosc> = {
      RachunekBankowy1: [farmerAccount],
      RachunekBankowy2: [buyerAccount],
    };

    generatePlatnosc(platnosc as Platnosc);

    expect(generujRachunekBankowy).toHaveBeenCalledTimes(2);
    expect(createHeader).toHaveBeenCalledWith('Płatność');
  });

  it('paruje rachunki bankowe według indeksu po obu stronach', () => {
    const farmer1 = { ...farmerAccount, OpisRachunku: { _text: 'Rachunek rolnika 1' } };
    const farmer2 = { ...farmerAccount, OpisRachunku: { _text: 'Rachunek rolnika 2' } };
    const buyer1 = { ...buyerAccount, OpisRachunku: { _text: 'Rachunek nabywcy 1' } };
    const buyer2 = { ...buyerAccount, OpisRachunku: { _text: 'Rachunek nabywcy 2' } };

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
