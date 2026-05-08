import {Content} from 'pdfmake/interfaces';
import {formatText, getValue} from '../../../shared/PDF-functions';
import {TRodzajFaktury} from '../../../shared/consts/FA.const';
import {FakturaRR as Fa} from '../../types/FaRR.types';
import FormatTyp, {Position} from '../../../shared/enums/common.enum';
import {AdditionalDataTypes} from '../../types/common.types';
import i18n from "i18next";

export function generateNaglowek(fa?: Fa, additionalData?: AdditionalDataTypes): Content[] {
    const headerContent: Content[] = [];
    const pushRightAlignedText = (
        value: number | string | undefined | null,
        format: FormatTyp | FormatTyp[]
    ): void => {
        const formatted = formatText(value, format);
        if (
            !Array.isArray(formatted) &&
            typeof formatted === 'object' &&
            formatted !== null &&
            'text' in formatted
        ) {
            headerContent.push({
                ...formatted,
                alignment: Position.RIGHT,
            });
        }
    };
    let invoiceName = '';

    switch (getValue(fa?.RodzajFaktury)) {
        case TRodzajFaktury.VAT_RR:
            invoiceName = i18n.t('invoice.header.primalInvoiceVatRr');
            break;
        case TRodzajFaktury.KOR_VAT_RR:
            invoiceName = i18n.t('invoice.header.correctedInvoiceVatRr');
            break;
    }

    headerContent.push({
        text: [
            { text: i18n.t('invoice.header.ksefPart1'), fontSize: 18 },
            { text: i18n.t('invoice.header.ksefPart2'), color: 'red', bold: true, fontSize: 18 },
            { text: i18n.t('invoice.header.ksefPart3'), bold: true, fontSize: 18 },
        ],
    });

    pushRightAlignedText(i18n.t('invoice.header.invoiceNumberLabel'), FormatTyp.ValueMedium);
    pushRightAlignedText(getValue(fa?.P_4C), FormatTyp.HeaderPosition);
    pushRightAlignedText(invoiceName, [FormatTyp.ValueMedium, FormatTyp.Default]);

    if (additionalData?.nrKSeF) {
        headerContent.push({
            text: [
                formatText(i18n.t('invoice.header.ksefNumberLabel'), FormatTyp.LabelMedium),
                formatText(additionalData.nrKSeF, FormatTyp.ValueMedium),
            ],
            alignment: Position.RIGHT,
        });
    }

    return headerContent;
}
