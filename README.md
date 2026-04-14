# KSeF PDF Generator

[![Download Latest](https://img.shields.io/github/v/release/Michal-Dudzik/ksef-pdf-generator?label=Download%20Latest&style=for-the-badge&logo=github)](https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest)

Command-line tool for generating PDF visualizations of KSeF invoices and UPO documents from XML files.

## Disclaimer

This project's versioning is separate from `CIRFMF/ksef-pdf-generator`. It is kept aligned with upstream changes, but uses its own version numbers because of additional work in this repository.

## Overview

- Generate invoice and UPO PDFs from XML input files.
- Run as a standalone Windows executable or as a Node.js CLI.
- Add KSeF metadata, QR codes, text watermarks, simplified invoice output, and optional PDF merge.
- Control number formatting with CLI flags or an optional `parameters.ini` file.

## Documentation

- [Installation and setup](docs/INSTALLATION.md)
- [Functionality and usage](docs/USAGE.md)
- [Testing notes](docs/TESTING.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)

## Quick Start

### Standalone executable

```batch
ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice
```

### Node.js build

```bash
npm install
npm run build
node dist/cli.cjs --input assets/invoice.xml --output invoice.pdf --type invoice
```
