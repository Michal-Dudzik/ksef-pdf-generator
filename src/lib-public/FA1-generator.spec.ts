import pdfMake from 'pdfmake/build/pdfmake';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateFA1 } from './FA1-generator';
import { Faktura } from './types/fa1.types';

import { AdditionalDataTypes } from './types/common.types';

vi.mock('./generators/FA1/Adnotacje', () => ({ generateAdnotacje: vi.fn(() => ({ example: 'adnotacje' })) }));
vi.mock('./generators/FA1/DodatkoweInformacje', () => ({
  generateDodatkoweInformacje: vi.fn(() => ({ example: 'dodatkowe' })),
}));
vi.mock('./generators/FA1/Platnosc', () => ({ generatePlatnosc: vi.fn(() => ({ example: 'platnosc' })) }));
vi.mock('./generators/FA1/Podmioty', () => ({ generatePodmioty: vi.fn(() => [{ example: 'podmioty' }]) }));
vi.mock('./generators/FA1/PodsumowanieStawekPodatkuVat', () => ({
  generatePodsumowanieStawekPodatkuVat: vi.fn(() => ({ example: 'podsumowanie' })),
}));
vi.mock('./generators/FA1/Rabat', () => ({ generateRabat: vi.fn(() => ({ example: 'rabat' })) }));
vi.mock('./generators/FA1/Szczegoly', () => ({ generateSzczegoly: vi.fn(() => ({ example: 'szczegoly' })) }));
vi.mock('./generators/FA1/WarunkiTransakcji', () => ({
  generateWarunkiTransakcji: vi.fn(() => ({ example: 'warunki' })),
}));
vi.mock('./generators/FA1/Wiersze', () => ({ generateWiersze: vi.fn(() => ({ example: 'wiersze' })) }));
vi.mock('./generators/FA1/Zamowienie', () => ({
  generateZamowienie: vi.fn(() => ({ example: 'zamowienie' })),
}));
vi.mock('./generators/common/DaneFaKorygowanej', () => ({
  generateDaneFaKorygowanej: vi.fn(() => ({ example: 'daneKorygowanej' })),
}));
vi.mock('./generators/common/Naglowek', () => ({ generateNaglowek: vi.fn(() => [{ example: 'naglowek' }]) }));
vi.mock('./generators/common/Rozliczenie', () => ({
  generateRozliczenie: vi.fn(() => ({ example: 'rozliczenie' })),
}));
vi.mock('./generators/common/Stopka', () => ({ generateStopka: vi.fn(() => [{ example: 'stopka' }]) }));
vi.mock('./PDF-functions', () => ({
  generateStyle: vi.fn(() => ({ styles: {}, defaultStyle: {} })),
  hasValue: vi.fn(() => true),
}));

describe('generateFA1', () => {
  const mockCreatePdfReturn = { example: 'pdfCreatedObject' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls pdfMake.createPdf and returns result (KOR with OkresFaKorygowanej, calls generateRabat)', () => {
    const invoice: Faktura = {
      Fa: {
        RodzajFaktury: { _text: 'KOR' },
        OkresFaKorygowanej: { _text: 'someValue' },
        Zamowienie: {},
        P_15: { _text: '15' },
        KodWaluty: { _text: 'PLN' },
        Adnotacje: {},
        Rozliczenie: {},
        Platnosc: {},
        WarunkiTransakcji: {},
      },
      Stopka: {},
      Naglowek: {},
    } as any;

    const additionalData: AdditionalDataTypes = { nrKSeF: 'nrKSeF' };

    const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);

    const result = generateFA1(invoice, additionalData);

    expect(createPdfSpy).toHaveBeenCalled();
    expect(result).toBe(mockCreatePdfReturn);
  });

  it('calls pdfMake.createPdf and returns result (non-KOR, calls generateWiersze)', () => {
    const invoice: Faktura = {
      Fa: {
        RodzajFaktury: { _text: 'VAT' },
        Zamowienie: {},
        P_15: { _text: '15' },
        KodWaluty: { _text: 'PLN' },
      },
      Stopka: {},
      Naglowek: {},
    } as any;

    const additionalData: AdditionalDataTypes = { nrKSeF: 'nrKSeF' };

    const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);

    const result = generateFA1(invoice, additionalData);

    expect(createPdfSpy).toHaveBeenCalled();
    expect(result).toBe(mockCreatePdfReturn);
  });

  describe('PDF metadata (info field)', () => {
    it('passes title, author and keywords derived from invoice data', () => {
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: {
            PelnaNazwa: { _text: 'Sprzedawca Sp. z o.o.' },
            NIP: { _text: '1234567890' },
          },
        },
        Podmiot2: {
          DaneIdentyfikacyjne: {
            NIP: { _text: '0987654321' },
          } as any,
        },
        Fa: {
          RodzajFaktury: { _text: 'VAT' },
        },
        Stopka: {},
        Naglowek: {},
      } as any;

      const additionalData: AdditionalDataTypes = { nrKSeF: 'TEST-NR-KSEF' };
      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);

      generateFA1(invoice, additionalData);

      expect(createPdfSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          info: expect.objectContaining({
            title: 'Faktura VAT TEST-NR-KSEF',
            author: 'Sprzedawca Sp. z o.o.',
            keywords: expect.stringContaining('1234567890'),
            creator: expect.stringMatching(/^ksef-pdf-generator\//),
            producer: expect.stringMatching(/^ksef-pdf-generator\//),
          }),
        })
      );
      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.keywords).toContain('0987654321');
    });

    it('uses NazwaHandlowa as author when PelnaNazwa is absent', () => {
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: {
            NazwaHandlowa: { _text: 'HandelBrand' },
            NIP: { _text: '1111111111' },
          },
        },
        Fa: { RodzajFaktury: { _text: 'VAT' } },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFA1(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.author).toBe('HandelBrand');
    });

    it('concatenates ImiePierwsze and Nazwisko as author when no company name is present', () => {
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: {
            ImiePierwsze: { _text: 'Jan' },
            Nazwisko: { _text: 'Kowalski' },
            NIP: { _text: '2222222222' },
          },
        },
        Fa: { RodzajFaktury: { _text: 'VAT' } },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFA1(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.author).toBe('Jan Kowalski');
    });

    it('collects NrEORI from Podmiot1 into keywords', () => {
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: { NIP: { _text: '3333333333' } },
          NrEORI: { _text: 'PL333EORI' },
        },
        Fa: { RodzajFaktury: { _text: 'VAT' } },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFA1(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.keywords).toContain('PL333EORI');
    });

    it('deduplicates identical identifiers across Podmiot1 and Podmiot2', () => {
      const sharedNIP = '5555555555';
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: { PelnaNazwa: { _text: 'Firma' }, NIP: { _text: sharedNIP } },
        },
        Podmiot2: {
          DaneIdentyfikacyjne: { NIP: { _text: sharedNIP } } as any,
        },
        Fa: { RodzajFaktury: { _text: 'VAT' } },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFA1(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      const keywords = info?.keywords as string;
      const occurrences = (keywords.match(new RegExp(sharedNIP, 'g')) ?? []).length;
      expect(occurrences).toBe(1);
    });

    it('sets author to empty string when Podmiot1 has no name data', () => {
      const invoice: Faktura = {
        Podmiot1: {
          DaneIdentyfikacyjne: { NIP: { _text: '4444444444' } },
        },
        Fa: { RodzajFaktury: { _text: 'VAT' } },
        Stopka: {},
        Naglowek: {},
      } as any;

      const createPdfSpy = vi.spyOn(pdfMake, 'createPdf').mockReturnValue(mockCreatePdfReturn as any);
      generateFA1(invoice, { nrKSeF: 'NR' });

      const info = createPdfSpy.mock.calls[0][0].info;
      expect(info?.author).toBe('');
    });
  });
});
