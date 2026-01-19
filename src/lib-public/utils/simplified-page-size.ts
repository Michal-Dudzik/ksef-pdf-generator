import { AdditionalDataTypes } from '../types/common.types';

const A4_WIDTH = 595.28;
const DEFAULT_LINE_HEIGHT = 1.2;
const DEFAULT_FONT_SIZE = 7;
const HEADER_FONT_SIZE = 18;
const HEADER_NUMBER_FONT_SIZE = 16;
const HEADER_VALUE_FONT_SIZE = 9;
const QR_CODE_SIZE = 170;
const QR_CODE_LABEL_FONT_SIZE = 10;
const QR_HEADER_FONT_SIZE = 10;
const QR_COLUMN_MARGIN_TOP = 10;
const QR_SECTION_TOP_MARGIN = 8;
const QR_SECTION_BOTTOM_MARGIN = 0;
const QR_VERIFICATION_MARGIN_TOP = 8;
const QR_LINK_EXTRA = 8;
const QR_EXTRA_PADDING = 24;
const EXTRA_HEIGHT_BUFFER = 4;

export const SIMPLIFIED_PAGE_MARGINS: [number, number, number, number] = [24, 24, 24, 24];

function lineHeight(fontSize: number): number {
  return fontSize * DEFAULT_LINE_HEIGHT;
}

function getHeaderHeight(hasNrKseF: boolean): number {
  const baseLines = [
    HEADER_FONT_SIZE,
    HEADER_VALUE_FONT_SIZE,
    HEADER_NUMBER_FONT_SIZE,
    HEADER_VALUE_FONT_SIZE,
  ];
  const lines = hasNrKseF ? [...baseLines, HEADER_VALUE_FONT_SIZE] : baseLines;
  return lines.reduce((total, fontSize) => total + lineHeight(fontSize), 0);
}

function getQrColumnsHeight(hasQrCode1: boolean, hasQrCode2: boolean): number {
  if (!hasQrCode1 && !hasQrCode2) {
    return 0;
  }

  const qrCode1Height = hasQrCode1
    ? QR_CODE_SIZE + QR_COLUMN_MARGIN_TOP + lineHeight(DEFAULT_FONT_SIZE)
    : 0;
  const qrCode2Height = hasQrCode2
    ? QR_CODE_SIZE + QR_COLUMN_MARGIN_TOP + lineHeight(QR_CODE_LABEL_FONT_SIZE)
    : 0;

  return Math.max(qrCode1Height, qrCode2Height);
}

function getQrSectionHeight(hasQrCode1: boolean, hasQrCode2: boolean): number {
  const hasAnyQr = hasQrCode1 || hasQrCode2;
  if (!hasAnyQr) {
    return QR_SECTION_BOTTOM_MARGIN;
  }

  const headerHeight = hasQrCode1 ? lineHeight(QR_HEADER_FONT_SIZE) + QR_SECTION_TOP_MARGIN * 2 : 0;
  const columnsHeight = getQrColumnsHeight(hasQrCode1, hasQrCode2);
  const verificationHeight = hasQrCode1
    ? QR_VERIFICATION_MARGIN_TOP + lineHeight(DEFAULT_FONT_SIZE) * 2
    : 0;
  const topLineHeight = QR_SECTION_TOP_MARGIN + 2;

  return (
    topLineHeight +
    headerHeight +
    columnsHeight +
    verificationHeight +
    (hasQrCode1 ? QR_LINK_EXTRA : 0) +
    QR_SECTION_BOTTOM_MARGIN
  );
}

export function getSimplifiedPageSize(additionalData?: AdditionalDataTypes): { width: number; height: number } {
  const hasQrCode1 = !!(additionalData?.qrCode1 && additionalData?.nrKSeF);
  const hasQrCode2 = !!additionalData?.qrCode2;
  const headerHeight = getHeaderHeight(!!additionalData?.nrKSeF);
  const qrSectionHeight = getQrSectionHeight(hasQrCode1, hasQrCode2);
  const verticalMargins = SIMPLIFIED_PAGE_MARGINS[0] + SIMPLIFIED_PAGE_MARGINS[2];
  const height = Math.ceil(
    headerHeight +
    qrSectionHeight +
    verticalMargins +
    QR_EXTRA_PADDING +
    EXTRA_HEIGHT_BUFFER,
  );

  return { width: A4_WIDTH, height };
}
