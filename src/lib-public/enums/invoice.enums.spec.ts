import { describe, expect, it } from 'vitest';
import { getZamowienieKorektaKey, ZamowienieKorekta } from './invoice.enums';

describe(getZamowienieKorektaKey.name, () => {
  it('maps legacy Polish enum values to slug keys', () => {
    expect(getZamowienieKorektaKey(ZamowienieKorekta.BeforeCorrection)).toBe(
      ZamowienieKorekta.BeforeCorrectionKey
    );
    expect(getZamowienieKorektaKey(ZamowienieKorekta.AfterCorrection)).toBe(
      ZamowienieKorekta.AfterCorrectionKey
    );
    expect(getZamowienieKorektaKey(ZamowienieKorekta.Order)).toBe(ZamowienieKorekta.OrderKey);
  });

  it('keeps slug enum values unchanged', () => {
    expect(getZamowienieKorektaKey(ZamowienieKorekta.BeforeCorrectionKey)).toBe(
      ZamowienieKorekta.BeforeCorrectionKey
    );
    expect(getZamowienieKorektaKey(ZamowienieKorekta.AfterCorrectionKey)).toBe(
      ZamowienieKorekta.AfterCorrectionKey
    );
    expect(getZamowienieKorektaKey(ZamowienieKorekta.OrderKey)).toBe(ZamowienieKorekta.OrderKey);
  });
});
