import { Content, ContentText } from 'pdfmake/interfaces';
import {
  createHeader,
  createLabelText,
  formatText,
  generateLine,
  generateTwoColumns,
  getTable,
  getValue,
  hasValue,
} from '../../../shared/PDF-functions';
import { Platnosc } from '../../types/FaRR.types';
import { generujRachunekBankowy } from './RachunekBankowy';
import FormatTyp from '../../../shared/enums/common.enum';
import i18n from 'i18next';

export function generatePlatnosc(platnosc: Platnosc | undefined): Content {
  if (!platnosc) {
    return [];
  }
  const table: Content[] = [generateLine(), ...createHeader(i18n.t('invoice.payment.payment'))];

  if (hasValue(platnosc.FormaPlatnosci)) {
    table.push(createLabelText(i18n.t('invoice.payment.paymentMethod3'), getValue(platnosc.FormaPlatnosci)));
  } else if (hasValue(platnosc.OpisPlatnosci)) {
    table.push(createLabelText(i18n.t('invoice.payment.paymentMethod3'), i18n.t('invoice.payment.other')));
    table.push(createLabelText(i18n.t('invoice.payment.description'), getValue(platnosc.OpisPlatnosci)));
  }

  if (hasValue(platnosc.LinkDoPlatnosci)) {
    table.push(formatText(i18n.t('invoice.payment.moneylessLink'), FormatTyp.Label));
    table.push({
      text: formatText(getValue(platnosc.LinkDoPlatnosci), FormatTyp.Link),
      link: formatText(getValue(platnosc.LinkDoPlatnosci), FormatTyp.Link),
    } as ContentText);
  }
  if (hasValue(platnosc.IPKSeF)) {
    table.push(createLabelText(i18n.t('invoice.payment.ksefTransferId'), platnosc.IPKSeF));
  }

  const rachunekBankowy1: Content[][] = getTable(platnosc.RachunekBankowy1).map((rachunek) =>
    generujRachunekBankowy([rachunek], i18n.t('invoice.payment.farmer'))
  );
  const rachunekBankowy2: Content[][] = getTable(platnosc.RachunekBankowy2).map((rachunek) =>
    generujRachunekBankowy([rachunek], i18n.t('invoice.payment.getter'))
  );
  const maxRows = Math.max(rachunekBankowy1.length, rachunekBankowy2.length);

  for (let i = 0; i < maxRows; i++) {
    table.push(generateTwoColumns(rachunekBankowy1[i] ?? [], rachunekBankowy2[i] ?? []));
  }

  table.push({ margin: [0, 8, 0, 0], text: '' });

  return table;
}
