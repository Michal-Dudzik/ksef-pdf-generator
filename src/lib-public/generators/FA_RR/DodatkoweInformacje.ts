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

export function generateDodatkoweInformacje(fa: Fa): Content[] {
  const table: Content[] = [
    ...createHeader('Dodatkowe informacje'),
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
    { name: 'lp', title: 'Lp.', format: FormatTyp.Default, width: 'auto' },
    { name: 'NrDokumentu', title: 'Numer dokumentu', format: FormatTyp.Default, width: '*' },
    { name: 'DataDokumentu', title: 'Data dokumentu', format: FormatTyp.Date, width: 'auto' },
  ];
  return buildListTable(dokumentZaplaty, 'Dokumenty Zapłaty', headers, [0, 0, 0, 4]);
}

function generateDodatkowyOpis(dodatkowyOpis: DodatkowyOpi[] | undefined): Content[] {
  const headers: HeaderDefine[] = [
    { name: 'lp', title: 'Lp.', format: FormatTyp.Default, width: 'auto' },
    { name: 'NrWiersza', title: 'Numer wiersza', format: FormatTyp.Default, width: 'auto' },
    { name: 'Klucz', title: 'Rodzaj informacji', format: FormatTyp.Default, width: 'auto' },
    { name: 'Wartosc', title: 'Treść informacji', format: FormatTyp.Default, width: '*' },
  ];
  return buildListTable(dodatkowyOpis, 'Dodatkowy opis', headers);
}
