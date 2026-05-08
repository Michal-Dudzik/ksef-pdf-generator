export enum ZamowienieKorekta {
  BeforeCorrection = 'Zamówienie przed korektą',
  AfterCorrection = 'Zamówienie po korekcie',
  Order = 'Zamówienie',
  BeforeCorrectionKey = 'before-correction',
  AfterCorrectionKey = 'after-correction',
  OrderKey = 'order',
}

export type ZamowienieKorektaKey =
  | ZamowienieKorekta.BeforeCorrectionKey
  | ZamowienieKorekta.AfterCorrectionKey
  | ZamowienieKorekta.OrderKey;

const zamowienieKorektaKeyMap: Record<ZamowienieKorekta, ZamowienieKorektaKey> = {
  [ZamowienieKorekta.BeforeCorrection]: ZamowienieKorekta.BeforeCorrectionKey,
  [ZamowienieKorekta.AfterCorrection]: ZamowienieKorekta.AfterCorrectionKey,
  [ZamowienieKorekta.Order]: ZamowienieKorekta.OrderKey,
  [ZamowienieKorekta.BeforeCorrectionKey]: ZamowienieKorekta.BeforeCorrectionKey,
  [ZamowienieKorekta.AfterCorrectionKey]: ZamowienieKorekta.AfterCorrectionKey,
  [ZamowienieKorekta.OrderKey]: ZamowienieKorekta.OrderKey,
};

export function getZamowienieKorektaKey(zamowienieKorekta: ZamowienieKorekta): ZamowienieKorektaKey {
  return zamowienieKorektaKeyMap[zamowienieKorekta];
}
