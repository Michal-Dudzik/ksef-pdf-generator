# Changelog

All notable changes to this project will be documented in this file.

## [1.6.0] - 2026-06-11

### Changed

- Synced selected upstream `1.1.18` changes from commits `42508b9ac46d52077333d1d47c6c01ca10233193` and `8264d23959cc1870056f3585d2986f6b61a022c5`.
- Removed implicit `Brak zapłaty` rendering from FA1, FA2, and FA3 payment sections when the XML does not explicitly mark the invoice as paid or partially paid.
- VAT summaries for FA1, FA2, and FA3 now render rows for zero-valued tax fields when those fields are present in the XML.
- Correction invoices (`KOR`, `KOR_ROZ`) now use a dedicated `Korekta kwoty należności ogółem` label for `P_15`.
- Bank account formatting now preserves account numbers that are already formatted with spaces.

### Added

- Added an executable integration plan for the upstream `1.1.18` sync in `docs/UPSTREAM_1_1_18_INTEGRATION_PLAN.md`.
- Added regression tests for implicit payment status rendering, zero-valued VAT summary rows, corrected `P_15` labels, and already-formatted bank account numbers.

## [1.5.0] - 2026-06-03

### Added

- Synced upstream changes `1.1.16` / `1.1.16 HF1`:
  - Added the generator application/version label to invoice technical information.
  - Added `technicalInfo.app_version` in `parameters.ini` and CLI config handling to control that version label independently from `technicalInfo.generated_in`.
- Updated `pdfmake` to `0.3.7` and migrated PDF generation to the new font-registration and promise-based output APIs.

### Fixed

- Fixed UPO 4.2 PDF generation to use UPO 4.2 types and UPO 4.2 document/header generators instead of the UPO 4.3 implementation.
- Fixed unsupported invoice XML versions to fail with an explicit `Unknown XML Version` error.
- Fixed invoice row `KwotaAkcyzy` formatting in FA1, FA2, and FA3 so it renders as currency.
- Split the technical information application and PDF generator version details into separate lines.

## [1.4.1] - 2026-05-22

### Fixed

- Prevented empty PDF sections from adding default bottom margin when `createSection(...)` receives no content, avoiding layout shifts and potential blank pages.
- Prevented the invoice footer from rendering spacer-only or empty QR blocks when no footer section has renderable data, including invoices with attachments and no `SystemInfo`.

## [1.4.0] - 2026-05-22

### Added

- Implemented changes from upstream release 1.1.12
  - Added bank account number formatting for FA2, FA3, and FA_RR invoice PDFs, grouping long account numbers for readability.

## [1.3.0] - 2026-05-18

### Added

- Added a `Technical information` section for invoice PDFs, including the existing generated-in system value and optional `AcquisitionDate` rendering when present in the XML and controllable via parameters file.

## [1.2.0] - 2026-05-12

### Added

- PDF file metadata is now embedded in every generated invoice PDF:
  - **Title** — set to `Faktura {RodzajFaktury} {NrKSeF}`, e.g. `Faktura VAT 20260101-SE-1234567890-ABC`
  - **Author** — set to the seller's full name or company name from Podmiot1 (for FA_RR: the issuing VAT taxpayer from Podmiot1)
  - **Keywords** — a comma-separated list of all unique tax and entity identifiers found in the XML (NIP, NrVatUE, NrID, IDWewn/IDWew, PESEL, NrEORI) across all parties: Podmiot1, Podmiot2, Podmiot3, and PodmiotUpoważniony
  - **Creator / Producer** — changed from `pdfmake` to `ksef-pdf-generator/{version}`, enabling unambiguous identification of the generating application and its version in PDF viewers and diagnostic reports

## [1.1.3] - 2026-05-11

### Added

- Added support for language selection to the CLI

## [1.1.2] - 2026-05-08

### Fixed

- more old tests

## [1.1.1] - 2026-05-08

### Fixed

- Fixed some old translation tests for English language

## [1.1.0] - 2026-05-08

### Added

- internationalization logic with Polish and English translations (changes from the update 1.1.9 from upstream repository)

### Fixed

- Synced selected upstream `1.1.11` changes from commit `153a7535d6c5d502f9ab83d108fc60555e389484`
- Fixed `P_6` label detection in `FA1`, `FA2`, and `FA3` details generators to resolve invoice type from object values via `getValue(...)`
- Updated `P_6` label tests in `FA1`, `FA2`, and `FA3` to mock `getValue(...)` for object-backed values (`{ _text: ... }`)
- Switched UPO context NIP label lookup from `invoice.subjectIdentificationData.nip` to `invoice.upo.nip` in `UPO4_2` and `UPO4_3`
- Added missing `invoice.upo.nip` translation key to both Polish and English language files

## [1.0.1] - 2026-04-14

### Changed

- Synced selected upstream changes from commits `66b920be75c78d7e4e102414907c2b7608778bb6` and `c13560c4310b2a6e2a134cba40c7f3c4feb4af5a`
- Added invoice watermark support across FA1, FA2, FA3 and FA_RR generators
- Added CLI support for watermark text via `--watermark` / `--watermark-text`
- Added CLI support for watermark styling via `--watermark-color`, `--watermark-opacity` and `--watermark-angle`
- Switched invoice date and date-time rendering to stable `Europe/Warsaw` formatting to avoid timezone-dependent output differences
- Updated CLI help and README with watermark usage examples and option documentation

### Fixed

- Allowed the final two-column section in `DaneFaKorygowanej` to break across pages, fixing correction invoice layout overflow
- Added regression tests for the new Warsaw-time formatting behavior
- Added test coverage for watermark propagation into generated PDF definitions

## [1.0.0] - 2026-04-01

### Changed

- Decided to change version from 0.0.59 to 1.0.0 after implementing new updates from the upstream (1.1.0) also because from this day onward the KSEF is used by everybody

## [0.0.59] - 2026-04-01

### Added

- Added requested (issue #3) parameterization for currency thousands separator formatting

## [0.0.58] - 2026-03-31

### Added

- Added support for FA_RR, CDATA parsing compatibility and invoice page numbering
- Added tests for FA_RR

### Changed

- Aligned the constants with the upstream implementation

## [0.0.57] - 2026-03-02

### Changed

- Updated vulnerable dependencies

## [0.0.56] - 2026-03-02

### Fixed

- Fixed custom metadata in the exe
- Copyright date no longer hardcoded

### Changed

- During release we will create new zip file with the uncompressed exe and changelog

## [0.0.55] - 2026-02-23

### Added

- Added version, company, and copyright metadata to the executable file properties

## [0.0.54] - 2026-02-20

### Fixed

- Large UPO files could cause a `Maximum call stack size exceeded`: issue #62

### Added

- New config file for parameterization of certain elements
- New parameter for the number of decimals in number type

## [0.0.53] - 2026-02-19

### Changed

- Hidden text „Brak zapłaty” for invoices with P_15 = 0

## [0.0.52] - 2026-02-17

### Fixed

- Now text `kwota należności ogółem`/`kwota pozostała do zapłaty` will be shown always if the field P_15 exists in the xml

## [0.0.51] - 2026-02-17

### Fixed

- The '%' character was not showing up for the values of `Stawka podatku`

## [0.0.50] - 2026-02-05

### Fixed

- Fixed "Brak identyfikatora" text not displaying when `BrakID = 1` in Podmiot2 and Podmiot2K elements (buyers without tax identification numbers)

## [0.0.49] - 2026-02-03

### Added

- OSS handling in VAT summaries and OSS tax rate display in rows/orders (FA1/FA2/FA3)
- Margin scheme (`P_PMarzy`) support in tax rate mapping
- Multiple bank account rendering in payment sections (row-wise pairs)

### Changed

- `KursWaluty` column is now conditional when values differ; OSS tax rate fields formatted as percentage
- Podmiot section layout updates: separator lines before "Nabywca"/"Podmiot inny", udział formatted as percentage, and "Imię i nazwisko" label added
- FA3 Podmiot2K/Podmiot3 mapping now matches by `IDNabywcy` with fallback to `Podmiot2`

### Fixed

- Phone numbers now render actual values instead of `[object Object]`
- Attachment table splitting keeps the first column visible across subtables
- VAT summary totals now include `P_14_5` where applicable
- Taxpayer status descriptions now accept numeric codes without type errors
- VAT summary table rows no longer emit undefined cells in FA2/FA3

## [0.0.48] - 2026-01-29

### Fixed

- JST and GV labels were not shown (quick fix)

## [0.0.47] - 2026-01-22

### Changed

- Removed version numbers from exe filename for consistency
- Added uncompressed release workflow

### Fixed

- Fixed workflows to use consistent exe filename without version numbers

## [0.0.46] - 2026-01-19

### Added

- Added ability to merge PDFs
- Added new simplified mode which shows only header with basic data and footer with QR codes

### Changed

- Updated README with information about PDF merging ability

### Fixed

- Fixed issue in FA2-generator that was failing a unit test

## [0.0.45] - 2026-01-16

### Added

- Prepared plan for implementing internationalization

### Changed

- Implemented updates from main repository (commit 5fb5a62)

## [0.0.44] - 2025-12-29

### Fixed

- Issue #13: Fixed date presentation error on attachment table (Błąd prezentacji dat na tabeli załącznika)
- Issue #14: Fixed missing prepayment invoice numbers outside KSeF in ROZ invoices (Błąd w fakturach ROZ: Brak wyświetlania numerów faktur zaliczkowych spoza KSeF)

## [0.0.43] - 2025-12-29

_(Version bump - no specific changes documented)_

## [0.0.42] - 2025-12-29

_(Version bump - no specific changes documented)_

## [0.0.41] - 2025-12-22

### Changed

- Changed the order of steps in release workflow
- Added new script to quickly create new release
- Updated release body text
- Test workflow no longer runs alongside release workflow

## [0.0.40] - 2025-12-22

### Changed

- Updates to the release workflow
- Updated integration tests to not require exe (CLI will work too)
- Added new script to run all integration tests on either exe or node
- Updated README regarding CI/CD

### Fixed

- Fixed timezone issue affecting tests

## [0.0.39] - 2025-12-22

### Added

- Added GitHub Actions workflows for automated releases

### Fixed

- Fixed error: "R.forEach is not a function" when there was a single entry in XML
- Fixed mapping issue: summary 0% export was reading wrong data

## Pre-0.0.39 Changes

### [2025-12-18]

### Changed

- Exe now has app version in the name

### [2025-12-17]

### Changed

- Logger now makes daily logs instead of monthly

### [2025-12-15]

### Fixed

- Fixed race issue in the logs

### Changed

- Updated the style of the logs

### [2025-12-10]

### Added

- Added logging to the CLI

### [2025-12-08]

### Changed

- Applied changes from the main repository: Update version to 0.0.34
- Refactored PDF generation functions to use generateColumns for layout
- Improved EORI label consistency across multiple files

### Fixed

- Fixes for generateColumns

### [2025-11-25]

### Added

- Added ability to pass certificate to display as a 2nd QR code
- Updated the CLI commands

### [2025-11-20]

### Added

- Major project rebuild: Added CLI support
- Added tests and scripts
- Optimizations and additional compression via UPX to make the final exe smaller (from 90MB to 21MB)
- Added compress-exe.bat script

### Changed

- Deleted web project

### [2025-11-14]

### Added

- Initial source code added

### [2025-10-31]

### Added

- Project initialization
- Initial commit
