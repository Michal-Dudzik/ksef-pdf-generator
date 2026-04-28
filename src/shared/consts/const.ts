import FormatTyp from '../enums/common.enum';
export {
  DEFAULT_TABLE_LAYOUT,
  FA1RolaPodmiotu3,
  FA2RolaPodmiotu3,
  FA3RolaPodmiotu3,
  FormaPlatnosci,
  getTaxpayerStatusDescription,
  Kraj,
  normalizeTaxpayerStatus,
  Procedura,
  RodzajTransportu,
  TAXPAYER_STATUS,
  TRodzajFaktury,
  TRolaPodmiotuUpowaznionegoFA1,
  TRolaPodmiotuUpowaznionegoFA2,
  TRolaPodmiotuUpowaznionegoFA3,
  TStawkaPodatku_FA1,
  TStawkaPodatku_FA2,
  TStawkaPodatku_FA3,
  TypKorekty,
  TypLadunku,
  TypRachunkowWlasnych,
} from './FA.const';

export const TableDataType: Record<string, FormatTyp> = {
  date: FormatTyp.Date,
  datetime: FormatTyp.DateTime,
  dec: FormatTyp.Currency,
  int: FormatTyp.Currency,
  time: FormatTyp.Time,
  txt: FormatTyp.Value,
};
