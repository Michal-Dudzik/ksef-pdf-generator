import { Content } from 'pdfmake/interfaces';
import {
  createHeader,
  createLabelText,
  formatText,
  generateColumns,
  generateLine,
  getTable,
  hasValue,
  verticalSpacing,
} from '../../../shared/PDF-functions';
import FormatTyp from '../../../shared/enums/common.enum';
import { Podmiot2, Podmiot2K } from '../../types/fa3.types';
import { generateDaneKontaktowe } from './PodmiotDaneKontaktowe';
import { generateCorrectedContent } from '../FA2/Podmiot2Podmiot2k';
import { generateAdres } from '../FA2/Adres';
import { generateDaneIdentyfikacyjneTPodmiot2Dto } from '../FA2/PodmiotDaneIdentyfikacyjneTPodmiot2Dto';
import i18n from 'i18next';

export function generatePodmiot2Podmiot2K(podmiot2: Podmiot2, podmiot2K: Podmiot2K): Content[] {
  const result: Content[] = [];

  result.push(generateLine());
  result.push(createHeader(i18n.t('invoice.subject2.buyer')));
  let firstColumn: Content[] = [];
  let secondColumn: Content[] = [];

  firstColumn.push(
    createHeader(i18n.t('invoice.subject2k.identificationData')),
    createLabelText(i18n.t('invoice.subject2.eoriNumber'), podmiot2.NrEORI)
  );
  if (podmiot2.DaneIdentyfikacyjne) {
    firstColumn.push(...generateDaneIdentyfikacyjneTPodmiot2Dto(podmiot2.DaneIdentyfikacyjne));
  }

  if (podmiot2.DaneKontaktowe) {
    firstColumn.push(formatText(i18n.t('invoice.subject2.contactDetails'), [FormatTyp.Label, FormatTyp.LabelMargin]));
    if (podmiot2.NrKlienta) {
      firstColumn.push(createLabelText(i18n.t('invoice.subject2.customerNumber'), podmiot2.NrKlienta));
    }
    firstColumn.push(generateDaneKontaktowe(getTable(podmiot2.DaneKontaktowe)));
  }

  if (firstColumn.length) {
    result.push(generateColumns([firstColumn, []]));
  }
  firstColumn = [];
  secondColumn = [];
  if (podmiot2K.Adres?.AdresL1?._text || hasValue(podmiot2K.IDNabywcy) || podmiot2K.DaneIdentyfikacyjne) {
    firstColumn = generateCorrectedContent(podmiot2K, i18n.t('invoice.subject2k.correctedContent'));
    secondColumn = generateCorrectedContent(podmiot2, i18n.t('invoice.subject2k.correctiveContent'));
  }

  if (podmiot2.AdresKoresp) {
    secondColumn.push(
      formatText(i18n.t('invoice.subject2.correspondenceAddress'), [FormatTyp.Label, FormatTyp.LabelMargin]),
      generateAdres(podmiot2.AdresKoresp)
    );
  }

  if (firstColumn.length || secondColumn.length) {
     result.push(generateColumns([firstColumn, secondColumn]));
  }
  if (result.length) {
    result.push(verticalSpacing(1));
  }
  return result;
}
