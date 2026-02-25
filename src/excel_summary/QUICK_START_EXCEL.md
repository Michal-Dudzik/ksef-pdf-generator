# Quick Start - KSeF Excel Summary Generator

## Szybki start w 3 krokach

### 1. Zbuduj projekt (jeśli jeszcze nie zbudowałeś)

```bash
npm install
npm run build
```

### 2. Uruchom eksport

**Windows:**
```batch
bin\ksef-excel-summary.bat -i assets\invoice.xml -o output.xlsx
```

**Linux/Mac:**
```bash
./bin/ksef-excel-summary.sh -i assets/invoice.xml -o output.xlsx
```

### 3. Otwórz plik Excel

Plik `output.xlsx` zawiera:
- **Arkusz "Linie Faktury"** - wszystkie dane linii w formacie tabelarycznym
- **Arkusz "Informacje"** - metadata faktury

## Przykłady użycia

### Przykład 1: Podstawowy eksport

```bash
# Eksportuj fakturę do Excel
bin\ksef-excel-summary.bat -i assets\invoice.xml -o outputs\excel\invoice.xlsx
```

Wynik:
```
✓ Excel file generated successfully: outputs\excel\invoice.xlsx
  - 13 lines exported
  - Currency: PLN
```

### Przykład 2: Faktura z dodatkowymi danymi

```bash
# Faktura z DodatkowyOpis - dane automatycznie zmapowane do linii
bin\ksef-excel-summary.bat -i assets\invoice-max-coverage.xml -o outputs\excel\detailed.xlsx --verbose
```

Wynik:
```
KSeF Excel Summary Generator
============================
Input:  assets\invoice-max-coverage.xml
Output: outputs\excel\detailed.xlsx

Parsing invoice XML...
Found 3 invoice lines
Invoice number: FA/MAX-COVERAGE/02/2026
Currency: EUR
Additional data keys: INFO_A, INFO_B

Generating Excel file...
✓ Excel file generated successfully: outputs\excel\detailed.xlsx
  - 3 lines exported
  - Currency: EUR
```

Excel będzie zawierał dodatkowe kolumny:
- `Dodatkowe: INFO_A`
- `Dodatkowe: INFO_B`

### Przykład 3: Pokaż wszystkie kolumny (nawet puste)

```bash
# Domyślnie puste kolumny są ukrywane. Użyj --include-all aby je pokazać
bin\ksef-excel-summary.bat -i assets\FA56.xml -o outputs\excel\FA56-full.xlsx --include-all
```

## Co się dzieje pod spodem?

1. **Parser** czyta XML i ekstrahuje:
   - Wszystkie pola z `<FaWiersz>` (linie faktury)
   - Dane z `<DodatkowyOpis>` powiązane z liniami przez `NrWiersza`

2. **Mapper** łączy dane:
   - Każda linia faktury to jeden obiekt
   - DodatkowyOpis jest mapowany jako `DodatkowyOpis_{Klucz}`

3. **Exporter** tworzy Excel:
   - Nagłówki z polskimi nazwami pól
   - Automatyczne formatowanie liczb i walut
   - Filtrowanie pustych kolumn (opcjonalnie wyłączane)
   - Profesjonalne styling

## Struktura danych w Excel

### Kolumny podstawowe (zawsze widoczne):
- **Lp.** - Numer linii
- **Nazwa towaru/usługi** - Pełna nazwa

### Kolumny cenowe (gdy niepuste):
- **Jednostka**, **Ilość**
- **Cena jedn. netto**, **Cena jedn. brutto**
- **Rabat**
- **Wartość netto**, **Wartość brutto**, **VAT**
- **Stawka VAT**, **Stawka OSS**

### Kolumny techniczne (gdy niepuste):
- **GTIN**, **PKWiU**, **CN**, **PKOB**
- **Kwota akcyzy**, **GTU**, **Procedura**
- **Data dostawy**, **Indeks**
- **Kurs waluty**, **Stan przed**

### Kolumny dodatkowe (dynamiczne):
Wszystkie klucze z `DodatkowyOpis` stają się kolumnami w formacie:
`Dodatkowe: {Klucz}`

## Najczęstsze pytania

### Pytanie: Dlaczego niektóre kolumny są ukryte?

**Odpowiedź:** Domyślnie narzędzie ukrywa kolumny, które są puste we WSZYSTKICH liniach faktury. To zwiększa czytelność.

Przykład: Jeśli żadna linia nie ma pola `GTIN`, kolumna `GTIN` nie będzie widoczna.

Aby zobaczyć wszystkie kolumny, użyj `--include-all`.

### Pytanie: Jak mapowane są DodatkowyOpis?

**Odpowiedź:** Element `<DodatkowyOpis>` ma pole `<NrWiersza>` wskazujące na numer linii faktury. Narzędzie automatycznie łączy dane:

```xml
<FaWiersz>
  <NrWierszaFa>1</NrWierszaFa>
  <P_7>Product Name</P_7>
  ...
</FaWiersz>

<DodatkowyOpis>
  <NrWiersza>1</NrWiersza>  <!-- Link do linii 1 -->
  <Klucz>SerialNumber</Klucz>
  <Wartosc>SN-123456</Wartosc>
</DodatkowyOpis>
```

W Excel zobaczysz:
```
| Lp | Nazwa        | ... | Dodatkowe: SerialNumber |
|----|--------------|-----|-------------------------|
| 1  | Product Name | ... | SN-123456              |
```

### Pytanie: Co z załącznikami?

**Odpowiedź:** Obecna wersja (Wariant A) **nie obsługuje** załączników (`<Zalacznik>`). 

Powód: Standard KSeF nie wymusza standardowego mechanizmu linkowania załączników do konkretnych linii faktury. To planowana funkcjonalność na przyszłość (Wariant B/C).

### Pytanie: Czy mogę przetwarzać wiele plików naraz?

**Odpowiedź:** Obecnie nie ma wbudowanej funkcji batch processing. Ale można użyć prostego skryptu:

**Windows:**
```batch
@echo off
for %%f in (invoices\*.xml) do (
    bin\ksef-excel-summary.bat -i "%%f" -o "excel\%%~nf.xlsx"
)
```

**Linux/Mac:**
```bash
#!/bin/bash
for file in invoices/*.xml; do
    filename=$(basename "$file" .xml)
    ./bin/ksef-excel-summary.sh -i "$file" -o "excel/${filename}.xlsx"
done
```

## Rozwiązywanie problemów

### Problem: "excel-summary.cjs not found"

```
Error: excel-summary.cjs not found. Please run 'npm run build' first.
```

**Rozwiązanie:**
```bash
npm run build
```

### Problem: Błąd parsowania XML

```
Error: Invalid invoice structure: missing Fa element
```

**Rozwiązanie:** Upewnij się, że plik XML jest poprawną fakturą KSeF (nie UPO, nie inny dokument).

### Problem: Brak kolumny w Excel

**Rozwiązanie:** Jeśli kolumna jest pusta we wszystkich liniach, jest domyślnie ukryta. Użyj `--include-all`:

```bash
bin\ksef-excel-summary.bat -i invoice.xml -o invoice.xlsx --include-all
```

## Więcej informacji

- **Pełna dokumentacja:** [EXCEL_SUMMARY.md](EXCEL_SUMMARY.md)
- **Dokumentacja techniczna:** [src/excel_summary/README.md](src/excel_summary/README.md)
- **Changelog:** [CHANGELOG_EXCEL.md](CHANGELOG_EXCEL.md)
- **Główny README:** [README.md](README.md)

## Pomoc

```bash
# Wyświetl pomoc
bin\ksef-excel-summary.bat --help

# Wyświetl wersję
bin\ksef-excel-summary.bat --version
```

## Feedback

Jeśli masz pytania, pomysły na ulepszenia lub znalazłeś błąd, zgłoś to w systemie Issues projektu.
