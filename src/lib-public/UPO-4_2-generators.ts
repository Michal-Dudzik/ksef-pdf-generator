import pdfMake from 'pdfmake/build/pdfmake';
import { Upo } from './types/upo-v4_3.types';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generateStyle } from '../shared/PDF-functions';
import { generateNaglowekUPO } from './generators/UPO4_3/Naglowek';
import { generateDokumentUPO } from './generators/UPO4_3/Dokumenty';
import { parseXML } from '../shared/XML-parser';
import { Position } from '../shared/enums/common.enum';
import i18n from 'i18next';

export async function generatePDFUPO(file: File): Promise<Blob> {
  const upo = (await parseXML(file)) as Upo;
  const docDefinition: TDocumentDefinitions = {
    content: [generateNaglowekUPO(upo.Potwierdzenie!), generateDokumentUPO(upo.Potwierdzenie!)],
    ...generateStyle(),
    pageSize: 'A4',
    pageOrientation: 'landscape',
    footer: function (currentPage: number, pageCount: number) {
      return {
        text: i18n.t('invoice.footer.pageOf', { current: currentPage, total: pageCount }),
        alignment: Position.RIGHT,
        margin: [0, 0, 20, 0],
      };
    },
  };

  return new Promise((resolve, reject): void => {
    pdfMake.createPdf(docDefinition).getBlob((blob: Blob): void => {
      if (blob) {
        resolve(blob);
      } else {
        reject('Error');
      }
    });
  });
}
