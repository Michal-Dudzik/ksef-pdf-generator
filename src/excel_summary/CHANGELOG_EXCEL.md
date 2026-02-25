# Excel Summary Generator - Changelog

## Version 0.0.56 (2026-02-25) - Security & Code Quality Update

### Changed
- **[SECURITY]** Migrated to official SheetJS package from CDN
  - Changed from `@e965/xlsx` (unofficial npm republisher) to official CDN-hosted tarball
  - Package source: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
  - Pinned exact version for supply-chain security (as recommended by SheetJS 2026 guidelines)
  - Eliminates third-party republisher risk while maintaining same functionality
  - **Bundle size remains 390.8KB** - no size impact
  - Import changed from `'@e965/xlsx'` to `'xlsx'` (standard package name)
- **[BREAKING]** Migrated from `exceljs` to SheetJS
  - Resolves security concerns: ExcelJS is unmaintained (2+ years old, 732 open issues)
  - SheetJS is actively maintained with regular security updates
  - **Reduced bundle size: 6.2MB → 391KB** (93.7% reduction!)
  - Same functionality, no API changes for end users

### Fixed
- Fixed HIGH-severity ReDoS vulnerability (GHSA-3ppc-4f35-3m26) in minimatch dependency
- Fixed all Code Rabbit review comments:
  - Replaced `any` types with proper type safety (`unknown` with type guards)
  - Updated to Node.js protocol imports (`node:fs`, `node:path`, `node:util`)
  - Extracted magic values into named constants (`PARSER_CONSTANTS`, `EXCEL_SETTINGS`)
  - Reduced cognitive complexity from 22 to <15 by extracting helper functions
  - Replaced nested ternaries with explicit if-else blocks
  - Removed code duplication (24+ repeated type casts)
  - Added explanatory comments for eslint-disable directives
  - Changed `global` to `globalThis` (modern standard)
  - Replaced `parseFloat/isNaN` with `Number.parseFloat/Number.isNaN`

### Security
- ✅ **0 vulnerabilities** (was 1 HIGH-severity)
- ✅ **Official distribution** (CDN-hosted, pinned version)
- ✅ **No third-party republishers** (eliminates supply-chain risk)
- ✅ **Actively maintained dependency** (SheetJS updated regularly)
- ✅ **Smaller attack surface** (93.7% smaller bundle vs ExcelJS)

## Version 0.0.55 (2026-02-23)

### Added ⭐ NEW
- **KSeF Excel Summary Generator** - nowe narzędzie do eksportu linii faktur do Excel
- Automatyczna ekstrakcja wszystkich pól z `FaWiersz` (linie faktury)
- Mapowanie `DodatkowyOpis` do odpowiednich linii przez `NrWiersza`
- Format szeroki (wide format) - każda linia faktury w jednym wierszu Excel
- Inteligentne filtrowanie kolumn - automatyczne ukrywanie pustych pól
- Dwa arkusze w pliku Excel:
  - "Linie Faktury" - główny arkusz z danymi
  - "Informacje" - metadata (numer faktury, waluta, liczba linii)
- Profesjonalne formatowanie Excel:
  - Nagłówki pogrubione z niebieskim tłem
  - Zamrożony pierwszy wiersz
  - Automatyczne formatowanie liczb i walut
  - Obramowania komórek
  - Automatyczna szerokość kolumn
- CLI z opcjami:
  - `-i, --input` - plik wejściowy XML
  - `-o, --output` - plik wyjściowy Excel
  - `--include-all` - pokaż wszystkie kolumny (nawet puste)
  - `--verbose` - tryb szczegółowy
- Skrypty wrapper dla Windows i Linux/Mac:
  - `bin/ksef-excel-summary.bat` (Windows)
  - `bin/ksef-excel-summary.sh` (Unix)
- Kompletna dokumentacja w `EXCEL_SUMMARY.md`
- Testy jednostkowe dla parsera
- Obsługa faktur z pojedynczą linią (automatyczna konwersja do tablicy)

### Technical Details
- Parser używa `xml-js` bezpośrednio (bez FileReader API)
- Biblioteka SheetJS (`@e965/xlsx`) do generowania plików Excel
- TypeScript z pełnymi typami
- Integracja z istniejącym systemem budowania (esbuild)
- Nowy skrypt npm: `npm run bundle-excel`
- Nowy skrypt npm: `npm run excel-summary`

### Use Cases
- Rozwiązanie problemu przewijania wizualizacji PDF - wszystkie dane linii w jednym miejscu
- Analiza faktur w arkuszu kalkulacyjnym
- Łatwy import do systemów ERP/księgowych
- Szybki przegląd wszystkich pozycji faktury

### Files Added
- `src/excel_summary/types.ts` - Typy TypeScript
- `src/excel_summary/parser.ts` - Parser XML i ekstrakcja danych
- `src/excel_summary/exporter.ts` - Generator Excel
- `src/excel_summary/cli.ts` - CLI interface
- `src/excel_summary/index.ts` - Publiczne API
- `src/excel_summary/parser.spec.ts` - Testy
- `src/excel_summary/README.md` - Dokumentacja techniczna
- `bin/ksef-excel-summary.bat` - Windows wrapper
- `bin/ksef-excel-summary.sh` - Unix wrapper
- `EXCEL_SUMMARY.md` - Główna dokumentacja użytkownika
- `CHANGELOG_EXCEL.md` - Ten plik

### Dependencies Added
- `xlsx` (from official CDN: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) - Official SheetJS library for Excel generation

### Known Limitations
- Załączniki (`Zalacznik/BlokDanych`) nie są obecnie przetwarzane
- Tylko format szeroki (wide format) - każda linia to jeden wiersz
- Brak batch processing wielu plików naraz
- Brak GUI

### Future Enhancements (Possible)
- Obsługa załączników z mapowaniem do linii
- Long format - jedna linia faktury jako wiele wierszy Excel
- Batch processing wielu XML naraz
- Konfigurowalne mapowanie pól
- Eksport do CSV/JSON
- GUI lub web interface
- Agregacja i sumowanie danych
