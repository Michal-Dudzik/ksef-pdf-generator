import type { Watermark } from 'pdfmake/interfaces';

const DEFAULT_WATERMARK_STYLE: Omit<Watermark, 'text'> = {
  color: '#B1B1B1',
  opacity: 0.2,
  bold: true,
  fontSize: 50,
};

export function generateWatermark(
  watermark?: string | Watermark
): Record<'watermark', Watermark> | null {
  if (typeof watermark === 'string' && watermark.trim() !== '') {
    return {
      watermark: {
        text: watermark,
        ...DEFAULT_WATERMARK_STYLE,
      },
    };
  } else if (
    watermark !== null &&
    typeof watermark === 'object' &&
    watermark.text &&
    watermark.text.trim() !== ''
  ) {
    return {
      watermark: {
        ...DEFAULT_WATERMARK_STYLE,
        ...watermark,
      },
    };
  }

  return null;
}
