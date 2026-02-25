# KSeF Excel Summary Generator

Narzędzie do ekstrakcji danych z linii faktur KSeF do formatu Excel.

## Funkcjonalność

Narzędzie wydobywa z plików XML KSeF:
- **Wszystkie dane z linii faktury** (`FaWiersz`) - podstawowe informacje o towarach/usługach
- **Dodatkowe dane** (`DodatkowyOpis`) - powiązane z konkretnymi liniami przez `NrWiersza`

Dane są eksportowane do Excel w **formacie szerokim** - każda linia faktury to jeden wiersz w Excel, wszystkie dane w kolumnach.

## Użycie

### Z linii komend (po zbudowaniu):

```bash
# Podstawowe użycie
node dist/excel-summary.cjs -i invoice.xml -o invoice.xlsx

# Z wszystkimi polami (także pustymi)
node dist/excel-summary.cjs -i invoice.xml -o invoice.xlsx --include-all

# Tryb verbose
node dist/excel-summary.cjs -i invoice.xml -o invoice.xlsx --verbose
```

### Programatycznie:

```typescript
import { parseInvoiceForExcel, exportToExcel } from './excel_summary';

// Parse XML
const data = await parseInvoiceForExcel('invoice.xml');

// Export to Excel
await exportToExcel(data, 'output.xlsx');

// With all fields included
await exportToExcel(data, 'output.xlsx', true);
```

## Struktura danych

### Podstawowe pola linii faktury:
- `NrWierszaFa` - Numer porządkowy linii
- `UU_ID` - Unikalny identyfikator (jeśli dostępny)
- `P_7` - Nazwa towaru/usługi
- `P_8A` - Jednostka miary
- `P_8B` - Ilość
- `P_9A` - Cena jednostkowa netto
- `P_9B` - Cena jednostkowa brutto
- `P_10` - Rabat
- `P_11` - Wartość netto
- `P_11A` - Wartość brutto
- `P_11Vat` - Wartość VAT
- `P_12` - Stawka VAT
- Oraz wiele innych pól technicznych (GTIN, PKWiU, CN, PKOB, GTU, itp.)

### Dodatkowe dane:
Wszystkie klucze z `DodatkowyOpis` są automatycznie mapowane na kolumny w formacie:
`DodatkowyOpis_{Klucz}`

## Struktura wyjściowego pliku Excel

Plik Excel zawiera dwa arkusze:

1. **Linie Faktury** - główny arkusz z danymi:
   - Nagłówki pogrubione, niebieskie tło
   - Zamrożony pierwszy wiersz (nagłówki)
   - Automatyczne formatowanie liczb i walut
   - Obramowania komórek
   - Automatyczna szerokość kolumn

2. **Informacje** - metadata:
   - Numer faktury
   - Waluta
   - Liczba linii
   - Data wygenerowania

## Opcje

- `--include-all` - Dołącz wszystkie pola, nawet jeśli są puste we wszystkich liniach
- `--verbose` - Szczegółowe informacje o procesie
- `--help` - Pomoc
- `--version` - Wersja

## Filtrowanie kolumn

Domyślnie narzędzie **automatycznie ukrywa kolumny**, które są puste we wszystkich liniach faktury. To znacznie zwiększa czytelność wyniku.

Kolumny `NrWierszaFa` i `P_7` (nazwa) są zawsze widoczne.

Aby zobaczyć wszystkie kolumny (nawet puste), użyj flagi `--include-all`.

## Przykłady

```bash
# Eksport podstawowy
node dist/excel-summary.cjs -i assets/invoice.xml -o output/invoice.xlsx

# Eksport z wieloma liniami
node dist/excel-summary.cjs -i assets/invoice-max-coverage.xml -o output/detailed.xlsx --verbose

# Eksport z wszystkimi polami
node dist/excel-summary.cjs -i assets/FA56.xml -o output/full.xlsx --include-all
```

## Wymagania

- Node.js 22.14.0+
- Biblioteka SheetJS (`xlsx` - official CDN distribution) - zainstalowana automatycznie

## Architektura

```
src/excel_summary/
├── types.ts       - Definicje typów TypeScript
├── parser.ts      - Parser XML i ekstrakcja danych
├── exporter.ts    - Generator plików Excel
├── cli.ts         - Interfejs linii komend
├── index.ts       - Główny plik eksportujący API
└── README.md      - Ta dokumentacja
```

## Rozwój

Narzędzie jest zaprojektowane jako **Wariant A** - minimalistyczne, szybkie rozwiązanie.

Możliwe rozszerzenia w przyszłości:
- Obsługa załączników (`Zalacznik/BlokDanych`)
- Różne formaty eksportu (long format)
- Batch processing wielu plików naraz
- Konfigurowalne mapowanie pól
- GUI/Web interface
