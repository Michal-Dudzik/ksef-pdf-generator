import type { Watermark } from 'pdfmake/interfaces';
import { describe, expect, it } from 'vitest';
import { generateWatermark } from './watermark';

const DEFAULT_WATERMARK = {
  text: 'DRAFT',
  color: '#B1B1B1',
  opacity: 0.2,
  bold: true,
  fontSize: 50,
};

describe('generateWatermark', () => {
  it('uses the default style for a text watermark', () => {
    expect(generateWatermark('DRAFT')).toEqual({
      watermark: DEFAULT_WATERMARK,
    });
  });

  it.each([
    ['color', { color: '#cc0000' }],
    ['opacity', { opacity: 0.15 }],
    ['angle', { angle: 315 }],
  ] satisfies Array<[string, Partial<Watermark>]>)(
    'preserves defaults when only %s is customized',
    (_option, customStyle) => {
      expect(generateWatermark({ text: 'DRAFT', ...customStyle })).toEqual({
        watermark: {
          ...DEFAULT_WATERMARK,
          ...customStyle,
        },
      });
    }
  );
});
