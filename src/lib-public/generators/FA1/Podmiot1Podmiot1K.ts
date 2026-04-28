import { Content } from 'pdfmake/interfaces';
import {
  createHeader,
  createLabelText,
  createSubHeader,
  generateColumns,
  getTable,
  getValue,
  hasValue,
  verticalSpacing,
} from '../../../shared/PDF-functions';
import { Podmiot1, Podmiot1K } from '../../types/fa1.types';
import { generatePodmiotAdres } from './PodmiotAdres';
import { generateDaneIdentyfikacyjne } from './PodmiotDaneIdentyfikacyjne';
import { generateDaneKontaktowe } from './PodmiotDaneKontaktowe';
import { getTaxpayerStatusDescription } from '../../../shared/consts/FA.const';
import i18n from 'i18next';

export function generatePodmiot1Podmiot1K(podmiot1: Podmiot1, podmiot1K: Podmiot1K): Content[] {
  const result: Content[] = createHeader(i18n.t('invoice.subject1.seller'));
  let firstColumn: Content[] = [];
  let secondColumn: Content[] = [];

  firstColumn.push(
    createSubHeader(i18n.t('invoice.subject1K.identificationData')),
    createLabelText(i18n.t('invoice.subject1.eoriNumber'), podmiot1.NrEORI)
  );
  if (podmiot1.DaneIdentyfikacyjne) {
    firstColumn.push(...generateDaneIdentyfikacyjne(podmiot1.DaneIdentyfikacyjne));
  }

  if (podmiot1.Email || podmiot1.Telefon) {
    firstColumn.push(generateDaneKontaktowe(podmiot1.Email, getTable(podmiot1.Telefon)));
  }
  if (hasValue(podmiot1.StatusInfoPodatnika)) {
    const statusCode = getValue(podmiot1.StatusInfoPodatnika);
    const statusInfo = getTaxpayerStatusDescription(statusCode);

    if (statusInfo) {
      firstColumn.push(createLabelText(i18n.t('invoice.subject1.taxpayerStatus'), statusInfo));
    }
  }
  if (firstColumn.length) {
    result.push(firstColumn);
  }
  firstColumn = generateCorrectedContent(podmiot1K, i18n.t('invoice.subject1K.correctedContent'));
  secondColumn = generateCorrectedContent(podmiot1, i18n.t('invoice.subject1K.correctiveContent'));

  if (podmiot1.AdresKoresp) {
    secondColumn.push(
      generatePodmiotAdres(podmiot1.AdresKoresp, i18n.t('invoice.subject1.correspondenceAddress'), true, [0, 12, 0, 1.3])
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

export function generateCorrectedContent(podmiot: Podmiot1 | Podmiot1K, headerText: string): Content[] {
  const result: Content[] = [];

  result.push(createSubHeader(headerText));

  if (podmiot.PrefiksPodatnika?._text) {
    result.push(createLabelText(i18n.t('invoice.subject1.vatPrefix'), podmiot.PrefiksPodatnika));
  }
  if (podmiot.DaneIdentyfikacyjne) {
    result.push(...generateDaneIdentyfikacyjne(podmiot.DaneIdentyfikacyjne));
  }
  if (podmiot.Adres) {
    result.push(generatePodmiotAdres(podmiot.Adres, i18n.t('invoice.subject1.address'), true, [0, 12, 0, 1.3]));
  }
  return result;
}
