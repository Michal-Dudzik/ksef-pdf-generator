import { Content, Margins } from 'pdfmake/interfaces';
import {
  createHeader,
  createSection,
  createSubHeader,
  getContentTable,
  getTable,
} from '../../../shared/PDF-functions';
import { HeaderDefine } from '../../../shared/types/pdf-types';
import { DodatkowyOpi, DokumentZaplaty, FakturaRR as Fa } from '../../types/FaRR.types';
import FormatTyp from '../../../shared/enums/common.enum';
import i18n from 'i18next';

export function generateDodatkoweInformacje(fa: Fa): Content[] {
  const table: Content[] = [
    ...createHeader(i18n.t('invoice.additionalInformation.additionalInformationLabel')),
    ...generateDokumentyZaplaty(fa.DokumentZaplaty),
    ...generateDodatkowyOpis(fa.DodatkowyOpis),
  ];

  return table.length > 1 ? createSection(table, true) : [];
}

function buildListTable<T extends object>(
  data: T[] | undefined,
  title: string,
  headers: HeaderDefine[],
  subHeaderMargin?: Margins
): Content[] {
  if (!data?.length) {
    return [];
  }
  const mappedData = getTable(data).map((item, index) => ({
    ...item,
    lp: { _text: index + 1 },
  }));
  const table: Content[] = createSubHeader(title, subHeaderMargin);
  const tableContent = getContentTable<(typeof mappedData)[0]>(headers, mappedData, '*', [0, 0, 0, 0]);
  if (tableContent.content) {
    table.push(tableContent.content);
  }
  return table;
}

function generateDokumentyZaplaty(dokumentZaplaty: DokumentZaplaty[] | undefined): Content[] {
  const headers: HeaderDefine[] = [
    { name: 'lp', title: i18n.t('invoice.additionalInformation.ordinalNumber'), format: FormatTyp.Default, width: 'auto' },
    {
      name: 'NrDokumentu',
      title: i18n.t('invoice.additionalInformation.documentNumber'),
      format: FormatTyp.Default,
      width: '*',
    },
    {
      name: 'DataDokumentu',
      title: i18n.t('invoice.additionalInformation.documentDate'),
      format: FormatTyp.Date,
      width: 'auto',
    },
  ];
  return buildListTable(dokumentZaplaty, i18n.t('invoice.additionalInformation.paymentDocuments'), headers, [0, 0, 0, 4]);
}

function generateDodatkowyOpis(dodatkowyOpis: DodatkowyOpi[] | undefined): Content[] {
  const headers: HeaderDefine[] = [
    { name: 'lp', title: i18n.t('invoice.additionalInformation.ordinalNumber'), format: FormatTyp.Default, width: 'auto' },
    { name: 'NrWiersza', title: i18n.t('invoice.additionalInformation.rowNumber'), format: FormatTyp.Default, width: 'auto' },
    { name: 'Klucz', title: i18n.t('invoice.additionalInformation.typeOfInformation'), format: FormatTyp.Default, width: 'auto' },
    { name: 'Wartosc', title: i18n.t('invoice.additionalInformation.informationContent'), format: FormatTyp.Default, width: '*'},
  ];
  return buildListTable(dodatkowyOpis, i18n.t('invoice.additionalInformation.additionalDescription'), headers);
}
