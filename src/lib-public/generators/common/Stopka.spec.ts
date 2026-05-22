import i18n from 'i18next';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateStopka } from './Stopka';
import { AdditionalDataTypes } from '../../types/common.types';
import { Naglowek } from '../../types/fa2.types';

function stringifyContent(content: unknown): string {
  return JSON.stringify(content);
}

describe('generateStopka technical information', () => {
  const naglowek: Naglowek = {
    SystemInfo: { _text: 'QAD Enterprise Applications' },
  };

  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('renders generated system information in the technical information section by default', () => {
    const additionalData: AdditionalDataTypes = { nrKSeF: 'TEST-KSEF' };

    const content = generateStopka(additionalData, undefined, naglowek);
    const serializedContent = stringifyContent(content);

    expect(serializedContent).toContain('Informacje techniczne');
    expect(serializedContent).toContain('Wytworzona w: ');
    expect(serializedContent).toContain('QAD Enterprise Applications');
  });

  it('renders acquisition date when it is present in XML and enabled', () => {
    const additionalData: AdditionalDataTypes = {
      nrKSeF: 'TEST-KSEF',
    };

    const content = generateStopka(additionalData, undefined, naglowek, undefined, undefined, {
      acquisitionDate: { _text: '2026-05-15 12:04:10' },
    });
    const serializedContent = stringifyContent(content);

    expect(serializedContent).toContain('Data nabycia: ');
    expect(serializedContent).toContain('2026');
  });

  it('does not render acquisition date when it is disabled in technical information config', () => {
    const additionalData: AdditionalDataTypes = {
      nrKSeF: 'TEST-KSEF',
      technicalInfo: {
        showAcquisitionDate: false,
      },
    };

    const content = generateStopka(additionalData, undefined, naglowek, undefined, undefined, {
      acquisitionDate: { _text: '2026-05-15 12:04:10' },
    });

    expect(stringifyContent(content)).not.toContain('Data nabycia: ');
  });

  it('does not render the technical information section when enabled is false', () => {
    const additionalData: AdditionalDataTypes = {
      nrKSeF: 'TEST-KSEF',
      technicalInfo: {
        enabled: false,
      },
    };

    const content = generateStopka(additionalData, undefined, naglowek);
    const serializedContent = stringifyContent(content);

    expect(serializedContent).not.toContain('Informacje techniczne');
    expect(serializedContent).not.toContain('Wytworzona w: ');
    expect(serializedContent).not.toContain('QAD Enterprise Applications');
  });

  it('does not render generated system information when showGeneratedIn is false', () => {
    const additionalData: AdditionalDataTypes = {
      nrKSeF: 'TEST-KSEF',
      technicalInfo: {
        showGeneratedIn: false,
      },
    };

    const content = generateStopka(additionalData, undefined, naglowek);
    const serializedContent = stringifyContent(content);

    expect(serializedContent).not.toContain('Wytworzona w: ');
    expect(serializedContent).not.toContain('QAD Enterprise Applications');
  });

  it('returns empty content when no footer section has renderable data', () => {
    const additionalData: AdditionalDataTypes = {
      nrKSeF: 'TEST-KSEF',
    };

    expect(generateStopka(additionalData, undefined, {})).toEqual([]);
  });
});
