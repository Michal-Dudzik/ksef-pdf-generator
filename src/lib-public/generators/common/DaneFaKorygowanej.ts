import { Content } from 'pdfmake/interfaces';
import { TypKorekty } from '../../../shared/consts/FA.const';
import {
  createHeader,
  createLabelText,
  createSection,
  generateTwoColumns,
  getTable,
} from '../../../shared/PDF-functions';
import { translateMap } from '../../../shared/generators/common/functions';
import { DaneFaKorygowanej, Fa as Fa1 } from '../../types/fa1.types';
import { Fa as Fa2 } from '../../types/fa2.types';
import { FakturaRR } from '../../types/FaRR.types';
import { Fa as Fa3 } from '../../types/fa3.types';
import i18n from 'i18next';

type SupportedCorrectionInvoice = Pick<FakturaRR, 'DaneFaKorygowanej' | 'NrFaKorygowany' | 'PrzyczynaKorekty' | 'TypKorekty'>
  | Pick<Fa1, 'DaneFaKorygowanej' | 'NrFaKorygowany' | 'PrzyczynaKorekty' | 'TypKorekty'>
  | Pick<Fa2, 'DaneFaKorygowanej' | 'NrFaKorygowany' | 'PrzyczynaKorekty' | 'TypKorekty'>
  | Pick<Fa3, 'DaneFaKorygowanej' | 'NrFaKorygowany' | 'PrzyczynaKorekty' | 'TypKorekty'>;

export function generateDaneFaKorygowanej(invoice?: SupportedCorrectionInvoice): Content[] {
  const result: Content[] = [];
  let firstColumn: Content[] = [];
  let secondColumn: Content[] = [];
  let previousSection: boolean = false;

  if (invoice) {
    const correctionInvoiceData = Array.isArray(invoice.DaneFaKorygowanej)
      ? invoice.DaneFaKorygowanej
      : invoice.DaneFaKorygowanej
        ? [invoice.DaneFaKorygowanej]
        : [];
    const daneFakturyKorygowanej: DaneFaKorygowanej[] = getTable(correctionInvoiceData);

    if (invoice.NrFaKorygowany) {
      firstColumn.push(createLabelText(i18n.t('invoice.correctedInvoice.correctInvoiceNumber'), invoice.NrFaKorygowany));
    }
    if (invoice.PrzyczynaKorekty) {
      firstColumn.push(createLabelText(i18n.t('invoice.correctedInvoice.correctionReason'), invoice.PrzyczynaKorekty));
    }
    if (invoice.TypKorekty?._text) {
      firstColumn.push(
        createLabelText(i18n.t('invoice.correctedInvoice.correctionEffectType'), translateMap(invoice.TypKorekty, TypKorekty))
      );
    }

    if (firstColumn.length) {
      firstColumn.unshift(createHeader(i18n.t('invoice.correctedInvoice.sectionHeader')));
    }

    if (daneFakturyKorygowanej?.length === 1) {
      secondColumn.push(createHeader(i18n.t('invoice.correctedInvoice.identificationHeader')));
      generateCorrectiveData(daneFakturyKorygowanej[0], secondColumn);
      if (firstColumn.length > 0 || secondColumn.length) {
        if (firstColumn.length) {
          result.push(generateTwoColumns(firstColumn, secondColumn));
        } else {
          result.push(generateTwoColumns(secondColumn, []));
        }
        previousSection = true;
      }
      firstColumn = [];
      secondColumn = [];
    } else {
      if (firstColumn.length > 1) {
        result.push(generateTwoColumns(firstColumn, []));
        previousSection = true;
      }
      firstColumn = [];
      daneFakturyKorygowanej?.forEach((item: DaneFaKorygowanej, index: number): void => {
        if (index % 2 === 0) {
          firstColumn.push(
            createHeader(i18n.t('invoice.correctedInvoice.identificationHeaderIndexed', { index: index + 1 }))
          );
          generateCorrectiveData(item, firstColumn);
        } else {
          secondColumn.push(
            createHeader(i18n.t('invoice.correctedInvoice.identificationHeaderIndexed', { index: index + 1 }))
          );
          generateCorrectiveData(item, secondColumn);
        }
      });
    }
  }

  if (firstColumn.length && secondColumn.length) {
    result.push(
      createSection([generateTwoColumns(firstColumn, secondColumn, undefined, false)], previousSection)
    );
  }
  return createSection(result, true);
}

function generateCorrectiveData(data: DaneFaKorygowanej, column: Content[]): void {
  if (data.DataWystFaKorygowanej) {
    column.push(createLabelText(i18n.t('invoice.correctedInvoice.issueDate'), data.DataWystFaKorygowanej));
  }
  if (data.NrFaKorygowanej) {
    column.push(createLabelText(i18n.t('invoice.correctedInvoice.invoiceNumber'), data.NrFaKorygowanej));
  }
  if (data.NrKSeFFaKorygowanej) {
    column.push(createLabelText(i18n.t('invoice.correctedInvoice.ksefNumber'), data.NrKSeFFaKorygowanej));
  }
}
