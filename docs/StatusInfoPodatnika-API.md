# StatusInfoPodatnika API Documentation

## Overview

`StatusInfoPodatnika` (Taxpayer Status Information) is a field in Polish KSeF (Krajowy System e-Faktur / National e-Invoice System) invoice data that indicates the special status of a taxpayer/seller.

## Breaking Change Notice (December 2024)

The data format for `StatusInfoPodatnika` has changed from text-based values to numeric codes. This library now supports **both formats** with backward compatibility.

## Current Numeric Codes (Standard)

The following numeric codes are the current standard used by the KSeF system:

| Code | Description (Polish) | Description (English) |
|------|---------------------|----------------------|
| `'1'` | Stan likwidacji | Liquidation status |
| `'2'` | Postępowanie restrukturyzacyjne | Restructuring proceedings |
| `'3'` | Stan upadłości | Bankruptcy status |
| `'4'` | Przedsiębiorstwo w spadku | Inherited business |

## Legacy Text Values (Deprecated but Supported)

For backward compatibility, the following legacy text values are still supported and automatically mapped to their numeric equivalents:

| Legacy Value | Maps to Code | Description |
|--------------|--------------|-------------|
| `'SAMO'` | `'1'` | Stan likwidacji (Liquidation status) |
| `'zarejestrowany'` | `'2'` | Postępowanie restrukturyzacyjne (Restructuring proceedings) |
| `'stan upadłości'` | `'3'` | Stan upadłości (Bankruptcy status) |
| `'przedsiębiorstwo w spadku'` | `'4'` | Przedsiębiorstwo w spadku (Inherited business) |

**Note:** Legacy value matching is **case-insensitive**.

## Usage Examples

### Input Data Format

The `StatusInfoPodatnika` field is typically part of the `Podmiot1` (Seller/Subject) data structure:

```typescript
interface Podmiot1 {
  // ... other fields ...
  StatusInfoPodatnika?: {
    _text: string;
  };
}
```

### Valid Input Examples

```typescript
// Modern numeric format (preferred)
const podmiot1 = {
  StatusInfoPodatnika: { _text: '1' }
};

// Legacy text format (still supported)
const podmiot1Legacy = {
  StatusInfoPodatnika: { _text: 'SAMO' }
};

// Case-insensitive legacy format
const podmiot1CaseInsensitive = {
  StatusInfoPodatnika: { _text: 'ZareJESTrowany' }
};

// All three examples above will produce the same output
```

### Output in Generated PDF

When a valid `StatusInfoPodatnika` is provided, the generated PDF will include:

```
Status podatnika: Stan likwidacji
```

### Handling Invalid or Missing Values

The library gracefully handles edge cases:

- **`undefined` or `null`**: No status label is rendered
- **Empty string**: No status label is rendered
- **Unrecognized code**: No status label is rendered (fails silently)
- **Whitespace**: Automatically trimmed before processing

```typescript
// No status label will be rendered for these cases
const examples = [
  { StatusInfoPodatnika: undefined },
  { StatusInfoPodatnika: { _text: '' } },
  { StatusInfoPodatnika: { _text: 'invalid_value' } },
  { StatusInfoPodatnika: { _text: '  ' } },
];
```

## API Functions

### `normalizeTaxpayerStatus(statusCode: string | null | undefined): string | undefined`

Normalizes taxpayer status codes to the current numeric format. Accepts both legacy text values and current numeric codes.

**Parameters:**
- `statusCode`: The status code from `StatusInfoPodatnika` (may be text or numeric)

**Returns:**
- Normalized numeric code (`'1'`, `'2'`, `'3'`, or `'4'`)
- `undefined` if the code is invalid, null, or empty

**Examples:**

```typescript
import { normalizeTaxpayerStatus } from './shared/consts/const';

normalizeTaxpayerStatus('SAMO');           // returns '1'
normalizeTaxpayerStatus('1');              // returns '1'
normalizeTaxpayerStatus('zarejestrowany'); // returns '2'
normalizeTaxpayerStatus('ZAREJESTROWANY'); // returns '2' (case-insensitive)
normalizeTaxpayerStatus('invalid');        // returns undefined
normalizeTaxpayerStatus(null);             // returns undefined
normalizeTaxpayerStatus('  3  ');          // returns '3' (trimmed)
```

### `getTaxpayerStatusDescription(statusCode: string | null | undefined): string | undefined`

Gets the human-readable description for a taxpayer status code. Handles both legacy text values and current numeric codes with backward compatibility.

**Parameters:**
- `statusCode`: The status code from `StatusInfoPodatnika`

**Returns:**
- Human-readable status description in Polish
- `undefined` if the code is invalid

**Examples:**

```typescript
import { getTaxpayerStatusDescription } from './shared/consts/const';

getTaxpayerStatusDescription('1');                    // returns 'Stan likwidacji'
getTaxpayerStatusDescription('SAMO');                 // returns 'Stan likwidacji'
getTaxpayerStatusDescription('2');                    // returns 'Postępowanie restrukturyzacyjne'
getTaxpayerStatusDescription('invalid');              // returns undefined
getTaxpayerStatusDescription('  4  ');                // returns 'Przedsiębiorstwo w spadku'
```

## Data Source Verification

### Verifying Production Data Format

To verify that your production data source returns numeric codes:

1. **Check recent invoice data** from your KSeF integration
2. **Look for the `StatusInfoPodatnika` field** in the XML or JSON response
3. **Verify the format** matches the numeric codes (`'1'`, `'2'`, `'3'`, `'4'`)

### Example KSeF XML Format

```xml
<Podmiot1>
  <!-- other fields -->
  <StatusInfoPodatnika>2</StatusInfoPodatnika>
</Podmiot1>
```

### Example Parsed JSON Format

```json
{
  "Podmiot1": {
    "StatusInfoPodatnika": {
      "_text": "2"
    }
  }
}
```

## Migration Guide

### For Existing Applications

If your application currently uses legacy text values:

1. **No immediate action required** - Legacy values are still supported
2. **Recommended**: Update data sources to use numeric codes
3. **Test thoroughly** with both old and new data formats
4. **Monitor logs** for any unrecognized status codes

### For New Applications

1. **Use numeric codes** (`'1'`, `'2'`, `'3'`, `'4'`) exclusively
2. **Validate input** against the current standard codes
3. **Handle edge cases** (null, undefined, invalid codes)

## Testing

The library includes comprehensive unit tests covering:

- ✅ All numeric status codes
- ✅ All legacy text values
- ✅ Case-insensitive matching
- ✅ Whitespace trimming
- ✅ Undefined/null handling
- ✅ Invalid code handling
- ✅ Edge cases

Run tests with:

```bash
npm test -- Podmiot1.spec.ts
```

## Legal References

This implementation is based on:
- **Polish VAT Act** (Ustawa o VAT)
- **KSeF Technical Documentation** (Ministry of Finance, Poland)
- **FA_VAT Schema** definitions

## Support

For issues or questions:
- Check the [test files](../src/lib-public/generators/) for usage examples
- Review the [const.ts](../src/shared/consts/const.ts) implementation
- Report issues via the project's issue tracker

---

**Last Updated:** December 2024  
**Version:** 2.0 (Numeric codes with legacy support)

