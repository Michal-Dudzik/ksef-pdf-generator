# Changelog

All notable changes to this project will be documented in this file.

## [0.0.52] - 2026-02-17

### Fixed

- now text `kwota należności ogółem`/`kwota pozostała do zapłaty` will be shown alwas if the field P_15 exists in the xml

## [0.0.51] - 2026-02-17

### Fixed

- the '%' character was not showing up for the values of `Stawka podatku`

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
