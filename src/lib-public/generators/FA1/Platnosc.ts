import { Content } from 'pdfmake/interfaces';
import {
  createHeader,
  createLabelText,
  generateLine,
  generateTwoColumns,
  getContentTable,
  getValue,
  getTable,
  hasValue,
} from '../../../shared/PDF-functions';
import { FormaPlatnosci } from '../../../shared/consts/FA.const';
import { HeaderDefine } from '../../../shared/types/pdf-types';
import { FP, Platnosc, PlatnosciCzesciowe, TerminyPlatnosci } from '../../types/fa1.types';
import { translateMap } from '../../../shared/generators/common/functions';
import { generujRachunekBankowy } from './RachunekBankowy';
import FormatTyp from '../../../shared/enums/common.enum';
import { TableWithFields, TerminPlatnosciContent } from '../../types/fa1-additional-types';
import i18n from 'i18next';

function isZeroCurrencyValue(value: unknown): boolean {
  const rawValue = getValue(value as any);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return false;
  }

  const parsedValue = Number(String(rawValue).replace(',', '.'));
  return Number.isFinite(parsedValue) && parsedValue === 0;
}

export function generatePlatnosc(platnosc: Platnosc | undefined, kwotaOgolnaP15?: unknown): Content {
  if (!platnosc) {
    return [];
  }

  const terminPlatnosci: TerminyPlatnosci[] = getTable(platnosc.TerminyPlatnosci);

  const zaplataCzesciowaHeader: HeaderDefine[] = [
    {
      name: 'TerminPlatnosci',
      title: i18n.t('invoice.payment.maturityDate'),
      format: FormatTyp.Default,
    },
  ];

  if (terminPlatnosci.some((termin: TerminyPlatnosci): FP | undefined => termin.TerminPlatnosciOpis)) {
    zaplataCzesciowaHeader.push({
      name: 'TerminPlatnosciOpis',
      title: i18n.t('invoice.payment.paymentDescription'),
      format: FormatTyp.Default,
    });
  }

  const zaplataCzesciowaNaglowek: HeaderDefine[] = [
    {
      name: 'DataZaplatyCzesciowej',
      title: i18n.t('invoice.payment.partialPaymentDate'),
      format: FormatTyp.Default,
    },
    {
      name: 'KwotaZaplatyCzesciowej',
      title: i18n.t('invoice.payment.partialPaymentAmount'),
      format: FormatTyp.Currency,
    },
    { name: 'FormaPlatnosci', title: i18n.t('invoice.payment.paymentMethod'), format: FormatTyp.FormOfPayment },
  ];

  const table: Content[] = [generateLine(), ...createHeader(i18n.t('invoice.payment.payment'))];
  const isP15EqualZero = isZeroCurrencyValue(kwotaOgolnaP15);

  if (platnosc.Zaplacono?._text === '1') {
    table.push(createLabelText(i18n.t('invoice.payment.paymentInformation'), i18n.t('invoice.payment.paidStatus')));
    table.push(createLabelText(i18n.t('invoice.payment.paymentDate'), platnosc.DataZaplaty, FormatTyp.Date));
  } else if (platnosc.ZaplataCzesciowa?._text === '1') {
    table.push(createLabelText(i18n.t('invoice.payment.paymentInformation'), i18n.t('invoice.payment.partialPayment')));
  } else if (!isP15EqualZero) {
    table.push(createLabelText(i18n.t('invoice.payment.paymentInformation'), i18n.t('invoice.payment.noPayment')));
  }

  if (hasValue(platnosc.FormaPlatnosci)) {
    table.push(
      createLabelText(i18n.t('invoice.payment.paymentMethod2'), translateMap(platnosc.FormaPlatnosci, FormaPlatnosci))
    );
  } else if (platnosc.OpisPlatnosci?._text) {
    table.push(createLabelText(i18n.t('invoice.payment.paymentMethod2'), i18n.t('invoice.payment.paymentDifferent')));
    table.push(createLabelText(i18n.t('invoice.payment.otherPaymentDescription'), platnosc.OpisPlatnosci));
  }

  const zaplataCzesciowa: PlatnosciCzesciowe[] = getTable(platnosc.PlatnosciCzesciowe);
  const tableZaplataCzesciowa: TableWithFields = getContentTable<(typeof zaplataCzesciowa)[0]>(
    zaplataCzesciowaNaglowek,
    zaplataCzesciowa,
    '*'
  );

  const terminPatnosciContent: (TerminyPlatnosci | TerminPlatnosciContent)[] = terminPlatnosci.map(
    (platnosc: TerminyPlatnosci): TerminyPlatnosci | TerminPlatnosciContent => {
      if (!terminPlatnosci.some((termin: TerminyPlatnosci): FP | undefined => termin.TerminPlatnosciOpis)) {
        return platnosc;
      } else {
        return {
          ...platnosc,
          TerminPlatnosciOpis: {
            _text: `${platnosc.TerminPlatnosciOpis?._text ?? ''}`,
          } as any,
        };
      }
    }
  );

  const tableTerminPlatnosci = getContentTable<(typeof terminPlatnosci)[0]>(
    zaplataCzesciowaHeader,
    terminPatnosciContent as TerminyPlatnosci[],
    '*'
  );

  if (zaplataCzesciowa.length > 0 && terminPlatnosci.length > 0) {
    table.push(
      generateTwoColumns(
        tableZaplataCzesciowa.content ?? [],
        tableTerminPlatnosci.content ?? [],
        [0, 4, 0, 0]
      )
    );
  } else if (terminPlatnosci.length > 0) {
    if (tableTerminPlatnosci.content) {
      table.push(generateTwoColumns([], tableTerminPlatnosci.content));
    }
  } else if (zaplataCzesciowa.length > 0 && tableZaplataCzesciowa.content) {
    table.push(tableZaplataCzesciowa.content);
  }

  const rachunekBankowy: Content[][] = getTable(platnosc.RachunekBankowy).map((rachunek) =>
    generujRachunekBankowy([rachunek], i18n.t('invoice.payment.bankAccountNumber'))
  );
  const rachunekBankowyFaktora: Content[][] = getTable(platnosc.RachunekBankowyFaktora).map((rachunek) =>
    generujRachunekBankowy([rachunek], i18n.t('invoice.payment.factorsBankAccountNumber'))
  );
  const rachunkiBankowe: Content[][] = [...rachunekBankowy, ...rachunekBankowyFaktora];

  if (rachunkiBankowe.length > 0) {
    rachunkiBankowe.forEach((rachunek, index) => {
      if (index % 2 === 0) {
        table.push(generateTwoColumns(rachunek, rachunkiBankowe[index + 1] ?? []));
      }
    });
  }

  if (platnosc.Skonto) {
    table.push(createHeader(i18n.t('invoice.payment.conditionalDiscount'), [0, 0]));
    table.push(createLabelText(i18n.t('invoice.payment.discountConditions'), platnosc.Skonto.WarunkiSkonta));
    table.push(createLabelText(i18n.t('invoice.payment.discountAmount'), platnosc.Skonto.WysokoscSkonta));
  }
  return table;
}
