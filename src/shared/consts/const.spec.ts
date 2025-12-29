import { describe, expect, it } from 'vitest';
import FormatTyp from '../enums/common.enum';
import { TableDataType } from './const';

describe('TableDataType', () => {
  it('should map date column type to FormatTyp.Date', () => {
    expect(TableDataType.date).toBe(FormatTyp.Date);
  });

  it('should map datetime column type to FormatTyp.DateTime', () => {
    expect(TableDataType.datetime).toBe(FormatTyp.DateTime);
  });

  it('should map time column type to FormatTyp.Time', () => {
    expect(TableDataType.time).toBe(FormatTyp.Time);
  });

  it('should map dec column type to FormatTyp.Currency', () => {
    expect(TableDataType.dec).toBe(FormatTyp.Currency);
  });

  it('should map int column type to FormatTyp.Currency', () => {
    expect(TableDataType.int).toBe(FormatTyp.Currency);
  });

  it('should map txt column type to FormatTyp.Value', () => {
    expect(TableDataType.txt).toBe(FormatTyp.Value);
  });

  it('should have exactly 6 type mappings', () => {
    expect(Object.keys(TableDataType)).toHaveLength(6);
  });
});

