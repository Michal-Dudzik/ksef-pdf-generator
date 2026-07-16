import { describe, expect, it } from 'vitest';
import { TRodzajFaktury } from '../../../shared/consts/FA.const';
import { FakturaRR } from '../../types/FaRR.types';
import { generateNaglowek } from './Naglowek';
import FormatTyp, { Position } from '../../../shared/enums/common.enum';

describe('generateNaglowek', () => {
  it('generates header for correction invoice VAT RR', () => {
    const fa: FakturaRR = {
      RodzajFaktury: { _text: TRodzajFaktury.KOR_VAT_RR },
    } as any;

    const result = generateNaglowek(fa);

    expect(
      result.some(
        (c) =>
          typeof c === 'object' &&
          c !== null &&
          'text' in c &&
          typeof (c as any).text === 'string' &&
          (c as any).text.includes('Faktura korygująca VAT RR')
      )
    ).toBe(true);
  });

  it('generates header with empty string for unknown invoice type', () => {
    const fa: FakturaRR = {
      RodzajFaktury: { _text: 'UNKNOWN' },
    } as any;

    const result = generateNaglowek(fa);

    expect(
      result.some(
        (c) =>
          typeof c === 'object' &&
          c !== null &&
          'text' in c &&
          typeof (c as any).text === 'string' &&
          (c as any).text.includes('')
      )
    ).toBe(true);
  });

  it('generates header even when fa is undefined', () => {
    const result = generateNaglowek();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders the KSeF number assignment date from the upstream acDate alias', () => {
    const result = generateNaglowek(undefined, {
      nrKSeF: 'KSEF-RR-123',
      acDate: '2026-06-23',
    });

    const assignmentDate = result.find(
      (content) =>
        typeof content === 'object' &&
        content !== null &&
        'text' in content &&
        Array.isArray(content.text) &&
        content.text.some(
          (part) => typeof part === 'object' && part !== null && 'text' in part && part.text === 'Data nadania numeru KSeF: '
        )
    ) as any;

    expect(assignmentDate).toBeDefined();
    expect(assignmentDate.alignment).toBe(Position.RIGHT);
    expect(assignmentDate.text[1]).toMatchObject({
      text: '23.06.2026',
      style: [FormatTyp.Date, FormatTyp.ValueMedium],
    });
  });
});
