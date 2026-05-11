import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { generateFARR } from './FARR-generator';
import { FaRR } from './types/FaRR.types';
import { AdditionalDataTypes } from './types/common.types';

vi.mock('./generators/FA_RR/Naglowek', () => ({ generateNaglowek: vi.fn(() => [{ example: 'naglowek' }]) }));
vi.mock('./generators/FA_RR/Podmioty', () => ({ generatePodmioty: vi.fn(() => [{ example: 'podmioty' }]) }));
vi.mock('./generators/FA_RR/Szczegoly', () => ({ generateSzczegoly: vi.fn(() => ({ example: 'szczegoly' })) }));
vi.mock('./generators/FA_RR/Wiersze', () => ({ generateWiersze: vi.fn(() => ({ example: 'wiersze' })) }));
vi.mock('./generators/FA_RR/DodatkoweInformacje', () => ({
  generateDodatkoweInformacje: vi.fn(() => ({ example: 'dodatkowe' })),
}));
vi.mock('./generators/FA_RR/Platnosc', () => ({ generatePlatnosc: vi.fn(() => ({ example: 'platnosc' })) }));
vi.mock('./generators/common/DaneFaKorygowanej', () => ({
  generateDaneFaKorygowanej: vi.fn(() => ({ example: 'daneKorygowanej' })),
}));
vi.mock('./generators/common/Rozliczenie', () => ({
  generateRozliczenie: vi.fn(() => ({ example: 'rozliczenie' })),
}));
vi.mock('./generators/common/Stopka', () => ({ generateStopka: vi.fn(() => [{ example: 'stopka' }]) }));
vi.mock('./PDF-functions', () => ({
  generateStyle: vi.fn(() => ({ styles: {}, defaultStyle: {} })),
}));

describe('generateFARR', () => {
  const mockCreatePdfReturn = { example: 'pdfCreatedObject' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls pdfMake.createPdf and returns result for a standard RR invoice', () => {
    const invoice: FaRR = {
      FakturaRR: {
        RodzajFaktury: { _text: 'RR' },
        KodWaluty: { _text: 'PLN' },
      },
      Stopka: {},
      Naglowek: {},
    } as any;

    const additionalData: AdditionalDataTypes = { nrKSeF: 'nrKSeF' };
    const createPdfSpy: MockInstance = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);

    const result: TCreatedPdf = generateFARR(invoice, additionalData);

    expect(createPdfSpy).toHaveBeenCalled();
    expect(result).toBe(mockCreatePdfReturn);
  });

  it('throws when FakturaRR is missing', () => {
    const invoice: FaRR = {} as any;
    const additionalData: AdditionalDataTypes = { nrKSeF: 'nrKSeF' };

    expect(() => generateFARR(invoice, additionalData)).toThrow('Missing required FakturaRR data in invoice');
  });

  describe('PDF metadata (info field)', () => {
    it('passes title, author and keywords derived from invoice data', () => {
      const invoice: FaRR = {
        Podmiot1: {
          DaneIdentyfikacyjne: {
            Nazwa: { _text: 'Nabywca VAT Sp. z o.o.' },
            NIP: { _text: '7777788888' },
          },
        },
        Podmiot2: {
          DaneIdentyfikacyjne: {
            NIP: { _text: '9999900000' },
          },
        },
        FakturaRR: {
          RodzajFaktury: { _text: 'RR' },
          KodWaluty: { _text: 'PLN' },
        },
        Stopka: {},
        Naglowek: {},
      } as any;

      const additionalData: AdditionalDataTypes = { nrKSeF: 'RR-NR-KSEF' };
      const createPdfSpy: MockInstance = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);

      generateFARR(invoice, additionalData);

      expect(createPdfSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          info: expect.objectContaining({
            title: 'Faktura RR RR-NR-KSEF',
            author: 'Nabywca VAT Sp. z o.o.',
            keywords: expect.stringContaining('7777788888'),
            creator: expect.stringMatching(/^ksef-pdf-generator\//),
            producer: expect.stringMatching(/^ksef-pdf-generator\//),
          }),
        })
      );
      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.keywords).toContain('9999900000');
    });

    it('collects IDWew from Podmiot3 entries into keywords', () => {
      const invoice: FaRR = {
        Podmiot1: {
          DaneIdentyfikacyjne: { Nazwa: { _text: 'Firma RR' }, NIP: { _text: '1234512345' } },
        },
        Podmiot3: [
          {
            DaneIdentyfikacyjne: {
              NIP: { _text: '5678956789' },
              IDWew: { _text: 'WEWN-RR-01' },
            },
          },
        ],
        FakturaRR: {
          RodzajFaktury: { _text: 'RR' },
          KodWaluty: { _text: 'PLN' },
        },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy: MockInstance = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFARR(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.keywords).toContain('5678956789');
      expect(info?.keywords).toContain('WEWN-RR-01');
    });

    it('uses RR_KOR as rodzajFaktury in the title for correction RR invoices', () => {
      const invoice: FaRR = {
        Podmiot1: {
          DaneIdentyfikacyjne: { Nazwa: { _text: 'Firma' }, NIP: { _text: '1111111111' } },
        },
        FakturaRR: {
          RodzajFaktury: { _text: 'RR_KOR' },
          KodWaluty: { _text: 'PLN' },
        },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy: MockInstance = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFARR(invoice, { nrKSeF: 'KOR-NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.title).toBe('Faktura RR_KOR KOR-NR');
    });
  });
});
