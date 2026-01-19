import { Column, Content, ContentQr, ContentStack, ContentText, Margins } from 'pdfmake/interfaces';
import {
  createHeader,
  createLabelText,
  createSection,
  createSubHeader,
  formatText,
  generateLine,
  generateQRCode,
  generateTwoColumns,
  getContentTable,
  getTable,
  verticalSpacing,
} from '../../../shared/PDF-functions';
import { HeaderDefine } from '../../../shared/types/pdf-types';
import { FormContentState } from '../../../shared/types/additional-data.types';
import { FP, Naglowek, Stopka } from '../../types/fa2.types';
import { Zalacznik } from '../../types/fa3.types';
import { generateZalaczniki } from './Zalaczniki';
import FormatTyp from '../../../shared/enums/common.enum';
import { Informacje, Rejestry } from '../../types/fa1.types';
import { AdditionalDataTypes } from '../../types/common.types';

export function generateStopka(
  additionalData?: AdditionalDataTypes,
  stopka?: Stopka,
  naglowek?: Naglowek,
  wz?: FP[],
  zalacznik?: Zalacznik
): Content[] {
  if (additionalData?.simplifiedMode) {
    return generateQRCodeData(additionalData);
  }

  const wzty: Content[] = generateWZ(wz);
  const rejestry: Content[] = generateRejestry(stopka);
  const informacje: Content[] = generateInformacje(stopka);
  const qrCode: Content[] = generateQRCodeData(additionalData);
  const zalaczniki: Content[] = !additionalData?.isMobile ? generateZalaczniki(zalacznik) : [];

  const result: Content = [
    verticalSpacing(1),
    ...(wzty.length ? [generateLine()] : []),
    ...(wzty.length ? [generateTwoColumns(wzty, [])] : []),
    ...(rejestry.length || informacje.length ? [generateLine()] : []),
    ...rejestry,
    ...informacje,
    ...(zalaczniki.length ? zalaczniki : []),
    { stack: [...qrCode], unbreakable: true },
    createSection(
      [
        {
          stack: createLabelText('Wytworzona w: ', naglowek?.SystemInfo),
          margin: [0, 8, 0, 0],
        },
      ],
      true,
      [0, 0, 0, 0]
    ),
  ];

  return createSection(result, false);
}

function generateWZ(wz?: FP[]): Content[] {
  const result: Content[] = [];
  const definedHeader: HeaderDefine[] = [{ name: '', title: 'Numer WZ', format: FormatTyp.Default }];
  const faWiersze: FP[] = getTable(wz ?? []);
  const content: FormContentState = getContentTable<(typeof faWiersze)[0]>(
    [...definedHeader],
    faWiersze,
    '*'
  );

  if (content.fieldsWithValue.length && content.content) {
    result.push(createSubHeader('Numery dokumentów magazynowych WZ', [0, 8, 0, 4]));
    result.push(content.content);
  }
  return result;
}

function generateRejestry(stopka?: Stopka): Content[] {
  const result: Content[] = [];
  const definedHeader: HeaderDefine[] = [
    { name: 'PelnaNazwa', title: 'Pełna nazwa', format: FormatTyp.Default },
    { name: 'KRS', title: 'KRS', format: FormatTyp.Default },
    { name: 'REGON', title: 'REGON', format: FormatTyp.Default },
    { name: 'BDO', title: 'BDO', format: FormatTyp.Default },
  ];
  const faWiersze: Rejestry[] = getTable(stopka?.Rejestry ?? []);
  const content: FormContentState = getContentTable<(typeof faWiersze)[0]>(
    [...definedHeader],
    faWiersze,
    '*'
  );

  if (content.fieldsWithValue.length && content.content) {
    result.push(createHeader('Rejestry'));
    result.push(content.content);
  }
  return result;
}

function generateInformacje(stopka?: Stopka): Content[] {
  const result: Content[] = [];
  const definedHeader: HeaderDefine[] = [
    { name: 'StopkaFaktury', title: 'Stopka faktury', format: FormatTyp.Default },
  ];
  const faWiersze: Informacje[] = getTable(stopka?.Informacje ?? []);
  const content: FormContentState = getContentTable<(typeof faWiersze)[0]>(
    [...definedHeader],
    faWiersze,
    '*'
  );

  if (content.fieldsWithValue.length && content.content) {
    result.push(createHeader('Pozostałe informacje'));
    result.push(content.content);
  }
  return result;
}

function generateQRCodeData(additionalData?: AdditionalDataTypes): Content[] {
  const result: Content = [];

  const qrColumns: Column[] = [];
  let qrCode1Stack: Content[] | undefined;
  let qrCode2Stack: Content[] | undefined;
  const qrCodeSize = 170;

  if (additionalData?.qrCode1 && additionalData.nrKSeF) {
    const qrCode: ContentQr | undefined = generateQRCode(additionalData.qrCode1, qrCodeSize);

    result.push(createHeader('Sprawdź, czy Twoja faktura znajduje się w KSeF!'));
    if (qrCode) {
      qrCode1Stack = [
        qrCode,
        {
          stack: [formatText(additionalData.nrKSeF, FormatTyp.Default)],
          width: 'auto',
          alignment: 'center',
          marginLeft: 10,
          marginRight: 10,
          marginTop: 10,
        } as ContentStack,
      ];
      const qrCode1Column: Column = {
        stack: [
          qrCode,
          {
            stack: [formatText(additionalData.nrKSeF, FormatTyp.Default)],
            width: 'auto',
            alignment: 'center',
            marginLeft: 10,
            marginRight: 10,
            marginTop: 10,
          } as ContentStack,
        ],
        width: qrCodeSize,
      } as Column;
      qrColumns.push(qrCode1Column);
    }
  }

  // second QR code for certificate if provided
  if (additionalData?.qrCode2) {
    const certQrCode: ContentQr | undefined = generateQRCode(additionalData.qrCode2, qrCodeSize);

    if (certQrCode) {
      qrCode2Stack = [
        certQrCode,
        {
          text: 'CERTYFIKAT',
          alignment: 'center',
          fontSize: 10,
          margin: [0, 10, 0, 0],
        },
      ];
      const qrCode2Column: Column = {
        stack: [
          certQrCode,
          {
            text: 'CERTYFIKAT',
            alignment: 'center',
            fontSize: 10,
            margin: [0, 10, 0, 0],
          },
        ],
        width: qrCodeSize,
        alignment: 'center',
      } as Column;
      qrColumns.push(qrCode2Column);
    }
  }

  if (qrColumns.length) {
    const alignedColumns =
      qrCode1Stack && qrCode2Stack
        ? [
            {
              stack: qrCode1Stack,
              width: qrCodeSize,
              alignment: 'left',
            } as Column,
            { text: '', width: '*' } as Column,
            {
              stack: qrCode2Stack,
              width: qrCodeSize,
              alignment: 'center',
            } as Column,
          ]
        : qrColumns;
    result.push({
      columns: alignedColumns,
      columnGap: 10,
      margin: [0, 10, 0, 0],
    });
  }

  if (additionalData?.qrCode1 && additionalData.nrKSeF) {
    const verificationLink = formatText(additionalData.qrCode1, FormatTyp.Link);
    const verificationLinkText: ContentText =
      typeof verificationLink === 'string' ? { text: verificationLink } : verificationLink;
    verificationLinkText.link = additionalData.qrCode1;
    verificationLinkText.marginTop = 5;
    result.push({
      stack: [
        formatText(
          'Nie możesz zeskanować kodu z obrazka? Kliknij w link weryfikacyjny i przejdź do weryfikacji faktury!',
          FormatTyp.Value
        ),
        verificationLinkText,
      ],
      margin: [0, 8, 0, 0],
      alignment: 'center',
    });
  }

  const sectionMargin: Margins | undefined = additionalData?.simplifiedMode ? [0, 0, 0, 0] : undefined;
  return createSection(result, true, sectionMargin);
}
