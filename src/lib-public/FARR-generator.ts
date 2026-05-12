import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generateStyle } from '../shared/PDF-functions';
import { AdditionalDataTypes } from './types/common.types';
import { FaRR } from './types/FaRR.types';
import { generateNaglowek } from './generators/FA_RR/Naglowek';
import { generatePodmioty } from './generators/FA_RR/Podmioty';
import { generateDaneFaKorygowanej } from './generators/common/DaneFaKorygowanej';
import { generateSzczegoly } from './generators/FA_RR/Szczegoly';
import { generateWiersze } from './generators/FA_RR/Wiersze';
import { generateDodatkoweInformacje } from './generators/FA_RR/DodatkoweInformacje';
import { generateRozliczenie } from './generators/common/Rozliczenie';
import { generatePlatnosc } from './generators/FA_RR/Platnosc';
import { generateStopka } from './generators/common/Stopka';
import { Position } from '../shared/enums/common.enum';
import { applyRuntimeFormattingConfig, resetRuntimeFormattingConfig } from '../shared/formatting-config';
import { generateWatermark } from '../shared/consts/watermark';
import { generatePdfInfo } from '../shared/pdf-metadata';
import i18n from 'i18next';

pdfMake.vfs = pdfFonts;

export function generateFARR(invoice: FaRR, additionalData: AdditionalDataTypes): TCreatedPdf {

  try {
    applyRuntimeFormattingConfig(additionalData);

    if (!invoice.FakturaRR) {
      throw new Error('Missing required FakturaRR data in invoice');
    }
    const fakturaRR = invoice.FakturaRR;

    const sellerName = invoice.Podmiot1?.DaneIdentyfikacyjne?.Nazwa?._text;

    const docDefinition: TDocumentDefinitions = {
      ...generateWatermark(additionalData?.watermark),
      info: generatePdfInfo(fakturaRR.RodzajFaktury?._text, additionalData.nrKSeF, sellerName),
      content: [
        ...generateNaglowek(fakturaRR, additionalData),
        generateDaneFaKorygowanej(fakturaRR),
        ...generatePodmioty(invoice),
        generateSzczegoly(fakturaRR),
        generateWiersze(fakturaRR),
        generateDodatkoweInformacje(fakturaRR),
        generateRozliczenie(fakturaRR.Rozliczenie, fakturaRR.KodWaluty?._text ?? ''),
        generatePlatnosc(fakturaRR.Platnosc),
        ...generateStopka(additionalData, invoice.Stopka, invoice.Naglowek),
      ],
      footer: (currentPage, pageCount) => {
        return {
          text: i18n.t('invoice.footer.pageOf', { current: currentPage, total: pageCount }),
          alignment: Position.RIGHT,
          margin: [0, 0, 40, 0],
        };
      },
      ...generateStyle(),
    };

    return pdfMake.createPdf(docDefinition);
  } finally {
    resetRuntimeFormattingConfig();
  }
}
