import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { generateStyle, getValue, hasValue } from '../shared/PDF-functions';
import { TRodzajFaktury } from '../shared/consts/FA.const';
import { generateAdnotacje } from './generators/FA1/Adnotacje';
import { generateDodatkoweInformacje } from './generators/FA1/DodatkoweInformacje';
import { generatePlatnosc } from './generators/FA1/Platnosc';
import { generatePodmioty } from './generators/FA1/Podmioty';
import { generatePodsumowanieStawekPodatkuVat } from './generators/FA1/PodsumowanieStawekPodatkuVat';
import { generateRabat } from './generators/FA1/Rabat';
import { generateSzczegoly } from './generators/FA1/Szczegoly';
import { generateWarunkiTransakcji } from './generators/FA1/WarunkiTransakcji';
import { generateWiersze } from './generators/FA1/Wiersze';
import { generateZamowienie } from './generators/FA1/Zamowienie';
import { generateDaneFaKorygowanej } from './generators/common/DaneFaKorygowanej';
import { generateNaglowek } from './generators/common/Naglowek';
import { generateRozliczenie } from './generators/common/Rozliczenie';
import { generateStopka } from './generators/common/Stopka';
import { Faktura } from './types/fa1.types';
import { ZamowienieKorekta } from './enums/invoice.enums';
import { AdditionalDataTypes } from './types/common.types';
import { getSimplifiedPageSize, SIMPLIFIED_PAGE_MARGINS } from './utils/simplified-page-size';
import { Position } from '../shared/enums/common.enum';
import { applyRuntimeFormattingConfig, resetRuntimeFormattingConfig } from '../shared/formatting-config';
import { generateWatermark } from '../shared/consts/watermark';
import { extractTaxIdsFromRecord, generatePdfInfo } from '../shared/pdf-metadata';
import i18n from 'i18next';

pdfMake.vfs = pdfFonts;

export function generateFA1(invoice: Faktura, additionalData: AdditionalDataTypes): TCreatedPdf {
  try {
    applyRuntimeFormattingConfig(additionalData);

    const isKOR_RABAT: boolean =
      invoice.Fa?.RodzajFaktury?._text == TRodzajFaktury.KOR && hasValue(invoice.Fa?.OkresFaKorygowanej);
    const rabatOrRowsInvoice: Content = isKOR_RABAT ? generateRabat(invoice.Fa!) : generateWiersze(invoice.Fa!);
    const content: Content[] = additionalData?.simplifiedMode
      ? [...generateNaglowek(invoice.Fa, additionalData), ...generateStopka(additionalData, invoice.Stopka, invoice.Naglowek, invoice.Fa?.WZ)]
      : [
        ...generateNaglowek(invoice.Fa, additionalData),
        generateDaneFaKorygowanej(invoice.Fa),
        ...generatePodmioty(invoice),
        generateSzczegoly(invoice.Fa!),
        rabatOrRowsInvoice,
        generateZamowienie(
          invoice.Fa?.Zamowienie,
          ZamowienieKorekta.Order,
          invoice.Fa?.P_15?._text ?? '',
          invoice.Fa?.RodzajFaktury?._text ?? '',
          invoice.Fa?.KodWaluty?._text ?? '',
          getValue(invoice.Fa?.Adnotacje?.P_PMarzy) as string | undefined
        ),
        generatePodsumowanieStawekPodatkuVat(invoice),
        generateAdnotacje(invoice.Fa?.Adnotacje),
        generateDodatkoweInformacje(invoice.Fa!),
        generateRozliczenie(invoice.Fa?.Rozliczenie, invoice.Fa?.KodWaluty?._text ?? ''),
        generatePlatnosc(invoice.Fa?.Platnosc, invoice.Fa?.P_15),
        generateWarunkiTransakcji(invoice.Fa?.WarunkiTransakcji),
        ...generateStopka(additionalData, invoice.Stopka, invoice.Naglowek, invoice.Fa?.WZ),
      ];
    const podmiot1di = invoice.Podmiot1?.DaneIdentyfikacyjne;
    const sellerNameParts = [podmiot1di?.ImiePierwsze?._text, podmiot1di?.Nazwisko?._text].filter(Boolean);
    const sellerName =
      podmiot1di?.PelnaNazwa?._text ||
      podmiot1di?.NazwaHandlowa?._text ||
      (sellerNameParts.length > 0 ? sellerNameParts.join(' ') : undefined);

    const taxIds: string[] = [
      podmiot1di?.NIP?._text,
      invoice.Podmiot1?.NrEORI?._text,
      ...extractTaxIdsFromRecord(invoice.Podmiot2?.DaneIdentyfikacyjne),
      invoice.Podmiot2?.NrEORI?._text,
      ...(invoice.Podmiot3 ?? []).flatMap(p => [
        ...extractTaxIdsFromRecord(p.DaneIdentyfikacyjne),
        p.NrEORI?._text,
      ]),
      ...extractTaxIdsFromRecord(invoice.PodmiotUpowazniony?.DaneIdentyfikacyjne),
      invoice.PodmiotUpowazniony?.NrEORI?._text,
    ].filter((id): id is string => !!id);

    const docDefinition: TDocumentDefinitions = {
      ...generateWatermark(additionalData?.watermark),
      content,
      info: generatePdfInfo(invoice.Fa?.RodzajFaktury?._text, additionalData.nrKSeF, sellerName, taxIds),
      footer: (currentPage, pageCount) => {
        return {
          text: i18n.t('invoice.footer.pageOf', { current: currentPage, total: pageCount }),
          alignment: Position.RIGHT,
          margin: [0, 0, 40, 0],
        };
      },
      ...(additionalData?.simplifiedMode
        ? {
          pageSize: getSimplifiedPageSize(additionalData),
          pageMargins: SIMPLIFIED_PAGE_MARGINS,
        }
        : {}),
      ...generateStyle(),
    };

    return pdfMake.createPdf(docDefinition);
  } finally {
    resetRuntimeFormattingConfig();
  }
}
