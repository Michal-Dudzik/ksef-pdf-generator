# KSeF Excel Summary Generator

Narzędzie do ekstrakcji danych z linii faktur KSeF do formatu Excel.

## Przegląd

KSeF Excel Summary Generator to dedykowane narzędzie służące do przetwarzania plików XML faktur KSeF i eksportu danych o liniach faktur (pozycjach) do plików Excel. Narzędzie automatycznie:

- Wydobywa wszystkie dane z linii faktury (`FaWiersz`)
- Mapuje dodatkowe informacje (`DodatkowyOpis`) do odpowiednich linii
- Generuje czytelny plik Excel z formatowaniem i filtrowanymi kolumnami

## Instalacja

Narzędzie jest częścią projektu `ksef-pdf-generator`. Wymaga instalacji zależności:

```bash
npm install
npm run build
```

## Użycie

### Z linii komend

#### Windows:

```batch
# Podstawowe użycie
bin\ksef-excel-summary.bat -i invoice.xml -o invoice.xlsx

# Z wszystkimi polami (także pustymi)
bin\ksef-excel-summary.bat -i invoice.xml -o invoice.xlsx --include-all

# Tryb verbose (szczegółowy)
bin\ksef-excel-summary.bat -i invoice.xml -o invoice.xlsx --verbose
```

#### Linux/Mac:

```bash
# Podstawowe użycie
./bin/ksef-excel-summary.sh -i invoice.xml -o invoice.xlsx

# Z wszystkimi polami
./bin/ksef-excel-summary.sh -i invoice.xml -o invoice.xlsx --include-all

# Tryb verbose
./bin/ksef-excel-summary.sh -i invoice.xml -o invoice.xlsx --verbose
```

#### Bezpośrednio przez Node.js:

```bash
node dist/excel-summary.cjs -i invoice.xml -o invoice.xlsx
```

### Argumenty

#### Wymagane:
- `-i, --input <path>` - Ścieżka do pliku XML faktury KSeF
- `-o, --output <path>` - Ścieżka do generowanego pliku Excel

#### Opcjonalne:
- `--include-all` - Dołącz wszystkie pola, nawet jeśli są puste we wszystkich liniach
- `--verbose` - Szczegółowe informacje o procesie przetwarzania
- `--help` - Wyświetl pomoc
- `--version` - Wyświetl wersję

## Przykłady

```bash
# Eksport podstawowej faktury
bin\ksef-excel-summary.bat -i assets\invoice.xml -o outputs\invoice.xlsx

# Eksport faktury z wieloma liniami i dodatkowymi danymi
bin\ksef-excel-summary.bat -i assets\invoice-max-coverage.xml -o outputs\detailed.xlsx --verbose

# Eksport z wyświetleniem wszystkich kolumn (nawet pustych)
bin\ksef-excel-summary.bat -i assets\FA56.xml -o outputs\full.xlsx --include-all

# Eksport faktury korygującej
bin\ksef-excel-summary.bat -i assets\172_inv.xml -o outputs\correction.xlsx
```

## Funkcjonalność

### Automatyczne wydobywanie danych

Narzędzie automatycznie ekstrahuje następujące dane:

#### Podstawowe informacje o linii:
- Numer porządkowy (`NrWierszaFa`)
- Unikalny identyfikator (`UU_ID`)
- Nazwa towaru/usługi (`P_7`)
- Jednostka miary (`P_8A`)
- Ilość (`P_8B`)

#### Ceny i wartości:
- Cena jednostkowa netto (`P_9A`)
- Cena jednostkowa brutto (`P_9B`)
- Rabat (`P_10`)
- Wartość netto (`P_11`)
- Wartość brutto (`P_11A`)
- Wartość VAT (`P_11Vat`)

#### Podatki:
- Stawka VAT (`P_12`)
- Stawka OSS (`P_12_XII`)
- Znacznik załącznika 15 (`P_12_Zal_15`)

#### Dodatkowe pola:
- GTIN, PKWiU, CN, PKOB
- Kwota akcyzy (`KwotaAkcyzy`)
- GTU, Procedura
- Data dostawy (`P_6A`)
- Indeks, Kurs waluty, Stan przed

#### Dodatkowe dane (DodatkowyOpis):
Wszystkie klucze z elementów `DodatkowyOpis` są automatycznie mapowane do kolumn w formacie `DodatkowyOpis_{Klucz}` i powiązane z odpowiednią linią faktury przez `NrWiersza`.

### Struktura pliku Excel

Wygenerowany plik Excel zawiera **dwa arkusze**:

#### 1. Linie Faktury (główny arkusz)
- Format szeroki - każda linia faktury to jeden wiersz
- Nagłówki pogrubione z niebieskim tłem
- Pierwszy wiersz zamrożony (przewijanie nie ukrywa nagłówków)
- Automatyczne formatowanie liczb i walut
- Czytelne obramowania komórek
- Automatyczna szerokość kolumn

#### 2. Informacje (metadata)
- Numer faktury
- Waluta
- Liczba wyeksportowanych linii
- Data i czas wygenerowania

### Inteligentne filtrowanie kolumn

Domyślnie narzędzie **automatycznie ukrywa kolumny**, które są puste we wszystkich liniach faktury. To znacząco zwiększa czytelność i zmniejsza rozmiar pliku.

**Zawsze widoczne:**
- `NrWierszaFa` (Lp.)
- `P_7` (Nazwa towaru/usługi)

**Inne kolumny** - wyświetlane tylko jeśli mają wartość w przynajmniej jednej linii.

Aby zobaczyć **wszystkie** kolumny (nawet puste), użyj flagi `--include-all`.

## Przypadki użycia

### Problem: Ciągłe przewijanie wizualizacji PDF
**Rozwiązanie:** Eksport do Excel pozwala klientom zobaczyć wszystkie dane jednej linii faktury bez przewijania.

### Problem: Analiza wielu faktur
**Rozwiązanie:** Szybki eksport danych do Excel umożliwia łatwą analizę w arkuszu kalkulacyjnym.

### Problem: Dodatkowe dane rozrzucone po dokumencie
**Rozwiązanie:** Automatyczne mapowanie `DodatkowyOpis` do linii - wszystkie dane jednej linii są w jednym miejscu.

### Problem: Integracja z systemami ERP/księgowymi
**Rozwiązanie:** Excel to uniwersalny format, łatwy do importu w większości systemów.

## Wymagania techniczne

- **Node.js:** 22.14.0 lub nowszy
- **Biblioteki:**
  - ExcelJS (automatycznie instalowane)
  - xml-js (automatycznie instalowane)
- **Systemy:** Windows, Linux, macOS

## Architektura

```
src/excel_summary/
├── types.ts          - Definicje typów TypeScript
├── parser.ts         - Parser XML i ekstrakcja danych z FaWiersz i DodatkowyOpis
├── exporter.ts       - Generator plików Excel (formatowanie, styling)
├── cli.ts            - Interfejs linii komend
├── index.ts          - Główny plik eksportujący API publiczne
├── parser.spec.ts    - Testy jednostkowe parsera
└── README.md         - Szczegółowa dokumentacja techniczna
```

## Użycie programatyczne (API)

Narzędzie można również używać programatycznie w Node.js:

```typescript
import { parseInvoiceForExcel, exportToExcel } from './src/excel_summary';

async function processInvoice() {
  // Parse XML invoice
  const data = await parseInvoiceForExcel('invoice.xml');
  
  console.log(`Found ${data.lines.length} lines`);
  console.log(`Invoice: ${data.invoiceNumber}`);
  console.log(`Currency: ${data.currency}`);
  
  // Export to Excel
  await exportToExcel(data, 'output.xlsx');
  
  // Or with all fields included
  await exportToExcel(data, 'output-full.xlsx', true);
}

processInvoice();
```

## Rozwój i rozszerzenia

Obecna wersja to **Wariant A** - minimalistyczne, szybkie rozwiązanie skupione na danych linii faktury.

### Możliwe rozszerzenia w przyszłości:

1. **Załączniki** - ekstrakcja danych z `Zalacznik/BlokDanych/Tabela`
2. **Long format** - alternatywny format gdzie jedna linia faktury = wiele wierszy Excel
3. **Batch processing** - przetwarzanie wielu plików XML naraz
4. **Konfigurowalne mapowanie** - użytkownik wybiera które pola eksportować
5. **GUI/Web interface** - interfejs graficzny
6. **Eksport do CSV/JSON** - dodatkowe formaty wyjściowe
7. **Agregacja danych** - sumowanie, grupowanie linii

## Testowanie

```bash
# Uruchom testy jednostkowe
npm run test:unit

# Uruchom wszystkie testy
npm test

# Testy z pokryciem kodu
npm run test:coverage
```

## Troubleshooting

### Problem: "excel-summary.cjs not found"
**Rozwiązanie:** Uruchom `npm run build` aby zbudować narzędzie.

### Problem: "Input file not found"
**Rozwiązanie:** Sprawdź ścieżkę do pliku XML. Użyj ścieżek bezwzględnych jeśli ścieżki względne nie działają.

### Problem: Brak niektórych kolumn w Excel
**Rozwiązanie:** Domyślnie puste kolumny są ukrywane. Użyj `--include-all` aby zobaczyć wszystkie.

### Problem: Błąd parsowania XML
**Rozwiązanie:** Upewnij się, że plik XML jest poprawną fakturą KSeF w formacie FA(3), FA(2) lub FA(1).

## Licencja

ISC License - zgodnie z głównym projektem ksef-pdf-generator.

## Kontakt i wsparcie

Narzędzie jest częścią projektu `ksef-pdf-generator`. Wszelkie pytania, problemy i propozycje zgłaszaj poprzez system Issues w repozytorium projektu.
