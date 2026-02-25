# Excel Summary Generator - Changelog

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
- Biblioteka `ExcelJS` do generowania plików Excel
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
- `exceljs@^4.4.0` - Biblioteka do generowania Excel

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
