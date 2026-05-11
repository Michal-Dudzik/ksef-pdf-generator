# Functionality and Usage

See also: [Repository overview](../README.md) | [Installation and setup](INSTALLATION.md)

This guide covers the main features, CLI options, common commands, configuration, integration, and development entry points.

## What the Tool Supports

- invoice PDF generation from KSeF XML
- UPO PDF generation from UPO XML
- KSeF number rendering
- up to two QR codes on invoice output
- text watermarks with configurable color, opacity, and angle
- simplified invoice output
- appending simplified output to an existing PDF
- configurable language, decimal formatting, and currency formatting
- embedded PDF file metadata (title, author, keywords, application identity) for archiving and diagnostics

## Quick Start

### Standalone executable

```batch
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o invoice.pdf -t invoice
bin\ksef-pdf-generator.exe -i assets\upo.xml -o upo.pdf -t upo
```

### Node.js CLI

```bash
node dist/cli.cjs --input assets/invoice.xml --output invoice.pdf --type invoice
node dist/cli.cjs --input assets/upo.xml --output upo.pdf --type upo
```

### Wrapper scripts

```batch
bin\ksef-pdf-generator.bat -i assets\invoice.xml -o invoice.pdf -t invoice
```

```bash
./bin/ksef-pdf-generator.sh -i assets/invoice.xml -o invoice.pdf -t invoice
```

## Command Reference

### Required arguments

- `--input`, `-i`: path to the input XML file
- `--output`, `-o`: path to the generated PDF
- `--type`, `-t`: `invoice` or `upo`

### Invoice-only options

- `--language`: generated PDF label language, either `pl` or `en`
- `--nrKSeF`: KSeF number, or `OFFLINE` for offline invoices
- `--watermark`, `--watermark-text`: watermark text
- `--watermark-color`: watermark color such as `#cc0000` or `gray`
- `--watermark-opacity`: number from `0` to `1`
- `--watermark-angle`: rotation angle in degrees
- `--qrCode1`: data for the main QR code
- `--qrCode2`: data for the second QR code shown under the first with label `certyfikat`
- `--simplified`: generate simplified invoice output
- `--mergePdf`, `--merge-pdf`: append the simplified result to an existing PDF
- `--currencyThousandsSeparator`, `--currency-thousands-separator`: enable thousands grouping for currency values

### Utility options

- `--help`, `-h`: print help
- `--version`: print version
- `--verbose`, `-v`: enable verbose logging

### Diagnostic scripts

- Windows: `scripts\diagnose.bat`
- Linux and macOS: `scripts/diagnose.sh`

## Common Examples

### Invoice with KSeF data

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --language en ^
  --nrKSeF "5265877635-20250808-9231003CA67B-BE" ^
  --qrCode1 "https://ksef-test.mf.gov.pl/client-app/invoice/..."
```

### Invoice with text watermark

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --watermark "DRAFT"
```

### Invoice with styled watermark

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --watermark "DRAFT" ^
  --watermark-color "#cc0000" ^
  --watermark-opacity "0.15" ^
  --watermark-angle "315"
```

### Offline invoice with certificate QR code

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --nrKSeF "OFFLINE" ^
  --qrCode1 "offline-qr-code-data" ^
  --qrCode2 "certificate-qr-code-data"
```

### Simplified invoice

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --nrKSeF "5265877635-20250808-9231003CA67B-BE" ^
  --qrCode1 "https://ksef-test.mf.gov.pl/client-app/invoice/..." ^
  --simplified
```

### Simplified invoice merged into an existing PDF

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice-merged.pdf -t invoice ^
  --nrKSeF "5265877635-20250808-9231003CA67B-BE" ^
  --qrCode1 "https://ksef-test.mf.gov.pl/client-app/invoice/..." ^
  --simplified ^
  --mergePdf "outputs\\invoice-basic.pdf"
```

## Watermark Notes

- The watermark is rendered as text, not as an image.
- `--watermark` and `--watermark-text` are equivalent.
- If you pass watermark style options, you must also pass watermark text.
- Watermark styling is rendered through `pdfmake`, so it appears on every page.

## PDF File Metadata

Every generated invoice PDF (FA1, FA2, FA3, FA_RR) automatically contains the following metadata fields, readable in any PDF viewer under the file properties dialog or via command-line tools:

| Field | Value | Source |
|---|---|---|
| **Title** | `Faktura {RodzajFaktury} {NrKSeF}` | `Fa.RodzajFaktury` + `--nrKSeF` argument |
| **Author** | Seller's full name or company name | `Podmiot1.DaneIdentyfikacyjne` (FA_RR: issuing VAT taxpayer) |
| **Keywords** | Comma-separated list of all tax/entity identifiers in the XML | NIP, NrVatUE, NrID, IDWewn, PESEL, NrEORI from all parties |
| **Creator / Producer** | `ksef-pdf-generator/{version}` | Always reflects the version that generated the file |

### Title examples

| Invoice type | Title |
|---|---|
| Standard VAT invoice | `Faktura VAT 20260101-SE-1234567890-ABC` |
| Correction invoice | `Faktura KOR 20260101-SE-1234567890-ABC` |
| Advance invoice | `Faktura ZAL 20260101-SE-1234567890-ABC` |
| Agricultural flat-rate invoice | `Faktura RR 20260101-SE-1234567890-ABC` |
| Offline invoice (no KSeF number) | `Faktura VAT` |

### Keywords field

The keywords field contains all unique tax and entity identifiers found anywhere in the invoice XML, drawn from all parties:

- **Podmiot1** (seller / issuing taxpayer): NIP, NrEORI
- **Podmiot2** (buyer): NIP, NrVatUE, NrID, IDWewn, PESEL, NrEORI
- **Podmiot3** (third parties): all identifier fields present
- **PodmiotUpoważniony** (authorized entity): NIP, NrEORI

Identifiers are deduplicated and joined with `, `. Non-identifier fields (company names, `BrakID` flags) are excluded.

Example value: `1234567890, PL9876543210, DE123456789`

### Creator / Producer field

The **Creator** and **Producer** PDF metadata fields are both set to `ksef-pdf-generator/{version}`, where `{version}` is the version number from `package.json`. This replaces the previous default value of `pdfmake`.

This is useful for:
- identifying which tool and version produced a given PDF when filing bug reports
- filtering PDFs by origin in document management or archiving systems

### Practical use for PDF archiving

PDF viewers (Adobe Acrobat, Windows Explorer, macOS Finder, Sumatra PDF) expose these metadata fields in the file properties dialog. Operating system search and indexing tools (Windows Search, macOS Spotlight) can search PDF metadata, making it possible to locate invoices by:

- seller name (Author field)
- KSeF reference number (Title field)
- NIP or other tax identifier (Keywords field)
- generating tool version (Creator field)

## Optional Configuration File

You can define `parameters.ini`:

- next to `ksef-pdf-generator.exe`
- in the current working directory
- in the project root

You can also force a path with `KSEF_CONFIG_PATH`.

Example:

```ini
[numberFormat]
decimals = 3

[currencyFormat]
thousands_separator = true

[i18n]
language = en
```

Behavior:

- `numberFormat.decimals = 2` changes `12.3456` to `12,35`
- `numberFormat.decimals = null` keeps legacy precision such as `12,3456`
- `currencyFormat.thousands_separator = true` changes `10000000` to `10 000 000,00`
- `i18n.language = en` generates English PDF labels
- supported languages are `pl` and `en`
- missing or invalid language falls back to `pl`

You can also override the language with the CLI argument:

```batch
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o invoice.pdf -t invoice --language en
```

```bash
node dist/cli.cjs --input assets/invoice.xml --output invoice.pdf --type invoice --language en
```

Or with an environment variable:

```batch
set KSEF_LANGUAGE=en
```

```bash
export KSEF_LANGUAGE=en
```

Precedence is: CLI argument, then `parameters.ini`, then `KSEF_LANGUAGE`, then the default `pl`.

## Logging

Persistent session logging is enabled by default.

Log files are written to a `logs/` directory:

- standalone executable: next to the `.exe`
- development mode: in the project directory

Environment variables:

```batch
set KSEF_PERSISTENT_LOG=0
set KSEF_LOG_DIR=C:\custom\path\logs
```

```bash
export KSEF_LOG_DIR=/var/log/ksef
```

## Backend Integration

### Node.js

```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const ALLOWED_LANGUAGES = ["pl", "en"];

async function generatePDF(inputPath, outputPath, type, options = {}) {
  let command = `./bin/ksef-pdf-generator.exe --input "${inputPath}" --output "${outputPath}" --type ${type}`;

  if (options.language) {
    if (!ALLOWED_LANGUAGES.includes(options.language)) {
      throw new Error(`Invalid language: must be one of: ${ALLOWED_LANGUAGES.join(", ")}`);
    }
    command += ` --language "${options.language}"`;
  }
  if (options.nrKSeF) {
    command += ` --nrKSeF "${options.nrKSeF}"`;
  }
  if (options.qrCode1) {
    command += ` --qrCode1 "${options.qrCode1}"`;
  }
  if (options.currencyThousandsSeparator) {
    command += " --currencyThousandsSeparator";
  }
  if (options.simplifiedMode) {
    command += " --simplified";
  }

  try {
    const { stdout } = await execPromise(command);
    console.log(stdout);
    return true;
  } catch (error) {
    console.error(error.stderr);
    return false;
  }
}

await generatePDF("assets/invoice.xml", "output/invoice.pdf", "invoice", {
  language: "en",
  nrKSeF: "5265877635-20250808-9231003CA67B-BE",
  qrCode1: "https://ksef-test.mf.gov.pl/...",
  currencyThousandsSeparator: true,
  simplifiedMode: true,
});
```

### C# (.NET)

```csharp
using System.Diagnostics;

public class KSefPdfGenerator
{
    private readonly string _executablePath;

    public KSefPdfGenerator(string executablePath)
    {
        _executablePath = executablePath;
    }

    public async Task<bool> GeneratePdfAsync(
        string inputPath,
        string outputPath,
        string type,
        string? language = null,
        string? nrKSeF = null,
        string? qrCode1 = null,
        bool currencyThousandsSeparator = false,
        bool simplifiedMode = false)
    {
        var arguments = $"--input \"{inputPath}\" --output \"{outputPath}\" --type {type}";

        var validLanguages = new[] { "pl", "en" };
        if (!string.IsNullOrEmpty(language))
        {
            if (!validLanguages.Contains(language))
            {
                throw new ArgumentException($"Invalid language: {language}. Must be 'pl' or 'en'.", nameof(language));
            }
            arguments += $" --language \"{language}\"";
        }

        if (!string.IsNullOrEmpty(nrKSeF))
        {
            arguments += $" --nrKSeF \"{nrKSeF}\"";
        }

        if (!string.IsNullOrEmpty(qrCode1))
        {
            arguments += $" --qrCode1 \"{qrCode1}\"";
        }

        if (currencyThousandsSeparator)
        {
            arguments += " --currencyThousandsSeparator";
        }

        if (simplifiedMode)
        {
            arguments += " --simplified";
        }

        var processStartInfo = new ProcessStartInfo
        {
            FileName = _executablePath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        try
        {
            using var process = Process.Start(processStartInfo);
            if (process == null)
            {
                Console.WriteLine("Failed to start process");
                return false;
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (process.ExitCode == 0)
            {
                Console.WriteLine(output);
                return true;
            }

            Console.WriteLine($"Error: {error}");
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception: {ex.Message}");
            return false;
        }
    }
}
```

## Development and Customization

### Main source areas

- `src/lib-public/` contains invoice and UPO generators
- `src/shared/` contains shared PDF functions and formatting helpers
- `src/cli/` contains argument parsing, command handling, and logging

### Common edit points

- change invoice header: `src/lib-public/generators/common/Naglowek.ts`
- change table styling: `src/shared/PDF-functions.ts`
- add a field: update types in `src/lib-public/types/`, then adjust generators in `src/lib-public/generators/`

### Build and test after changes

```bash
npm run build
npm run cli -- --input assets/invoice.xml --output test.pdf --type invoice
```
