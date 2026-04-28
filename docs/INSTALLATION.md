# Installation and Setup

See also: [Repository overview](../README.md) | [Functionality and usage](USAGE.md)

This guide covers installation, local setup, standalone builds, verification, troubleshooting, and release flow.

## Installation Paths

### Option 1: Standalone executable

Recommended for production or backend integration on Windows.

- No Node.js runtime is required on the machine where the executable is used.
- The executable bundles the runtime and application together.
- Releases are published at [GitHub Releases](https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest).

#### Download and run

1. Open the latest [release page](https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest).
2. Download `ksef-pdf-generator.exe`.
3. Run it directly:

```batch
ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice
```

#### Use the bundled repository build

If you cloned this repository and already have the executable in `bin/`:

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice
```

### Option 2: Standard installation

Recommended for development or cross-platform usage.

Requirement: Node.js `22.14.0` or newer.

#### Windows

```batch
scripts\setup.bat
```

#### Linux and macOS

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### Manual install

```bash
npm install
npm run build
```

## Build Standalone Executable

The standalone executable uses Node.js Single Executable Applications (SEA).

### Prerequisites

- Windows build machine
- Node.js `22.14.0` or newer

### Build command

```batch
scripts\build-standalone-win.bat
```

The resulting executable does not require Node.js on the target machine.

## Verify the Installation

### Help output

```batch
bin\ksef-pdf-generator.exe --help
```

### Version output

```batch
bin\ksef-pdf-generator.exe --version
```

### Diagnostics

```batch
scripts\diagnose.bat
```

### Generate sample PDFs

```batch
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o test_invoice.pdf -t invoice
bin\ksef-pdf-generator.exe -i assets\upo.xml -o test_upo.pdf -t upo
```

### Optional language selection

The generated PDF language can be controlled in `parameters.ini` or with the `KSEF_LANGUAGE` environment variable.

Example `parameters.ini`:

```ini
[i18n]
language = en
```

Supported values:

- `pl`
- `en`

If the value is missing or invalid, the default is `pl`.

For a broader Node.js smoke test:

```bash
node dist/cli.cjs --input assets/invoice-max-coverage.xml --output outputs/test_max_cov.pdf --type invoice --nrKSeF "4342534586-20251103-s0cOP4pbUBZPye4" --qrCode1 "https://ksef-test.mf.gov.pl/client-app/invoice/4342534586/03-11-2025/s0cOP4pbUBZPye4NePFHq8AiEEbxz_JttFipc16seCU%22"
```

## Troubleshooting

### Quick diagnostic

Start with:

```batch
scripts\diagnose.bat
```

It checks project files, build output, dependencies, file permissions, and execution readiness.

### Verbose output

```batch
set KSEF_VERBOSE=1
set KSEF_LOG_FILE=debug.log
bin\ksef-pdf-generator.exe -i input.xml -o output.pdf -t invoice --verbose
```

### Common issues

#### Standalone executable does not run

- Unblock the file in Windows file properties if it was downloaded from another machine.
- Install Visual C++ Redistributables if the runtime is missing.
- Check antivirus or endpoint protection quarantine.
- Run the executable from Command Prompt to inspect errors:

```batch
bin\ksef-pdf-generator.exe --help
```

#### Node.js is missing from `PATH`

Verify the installation in a new terminal:

```batch
node --version
npm --version
```

If you do not want a Node.js dependency, use the standalone executable instead.

#### `npm install` fails

Possible fixes:

```batch
npm cache clean --force
```

If you are behind a corporate proxy:

```batch
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### Build fails after install

Retry from a clean dependency tree:

```batch
rmdir /s /q node_modules
del package-lock.json
scripts\setup.bat
```

#### The command finishes but no PDF is created

- Confirm the output directory exists and is writable.
- Re-run with verbose mode enabled.
- Check generated logs and diagnostics.

#### Input file is not found

Use absolute paths if the current working directory is unclear:

```batch
bin\ksef-pdf-generator.exe -i C:\full\path\to\invoice.xml -o C:\full\path\to\output.pdf -t invoice
```

#### Windows SEA build warnings

If you see messages such as `signtool not found` or `signature seems corrupted`:

- the executable will usually still run correctly
- Windows SmartScreen may be more suspicious of the binary
- installing the Windows SDK provides `signtool`
- signing the final executable is recommended for distribution

Example signing command:

```batch
signtool sign /f your-certificate.pfx /p password bin\ksef-pdf-generator.exe
```

## Maintainer Release Flow

Releases are built and distributed through GitHub Actions.

### Recommended version bump flow

```bash
git add .
git commit -m "Prepare release"
git push

npm version patch
git push --follow-tags
```

You can also use:

- `npm version minor`
- `npm version major`

### Manual alternatives

Create and push a tag:

```bash
git tag -a v1.0.2 -m "Release version 1.0.2"
git push origin v1.0.2
```

Or run the workflow manually from the GitHub Actions UI.

## Deployment Checklist

### Standalone executable on Windows

- Windows Server 2012 R2 or later
- Visual C++ Redistributables installed
- write permissions in the working directory
- execution policy allows `.exe` files
- antivirus does not block the executable

### Node.js installation

- Node.js `22.14.0+`
- `npm` available in `PATH`
- write permissions in the working directory
- network access for dependency installation if building from source
