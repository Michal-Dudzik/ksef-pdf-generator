# Integration Report: f48680a

Summary
- Upstream commit: f48680a65f5601b7e00ccb28b21a28fc7b3c3364 (chore(): 1.0.0)
- Branch: integrate-upstream-f48680a
- Artifacts: upstream_f48680a.patch, upstream_f48680a.summary.txt
- Not applied: src/app-public/main.ts (directory not present in this fork)

Already Present Or Redundant
- Taxpayer status mapping logic already existed via `getTaxpayerStatusDescription` and `TAXPAYER_STATUS`; kept helper to support legacy codes.
- `getTStawkaPodatku` marza handling already present in `src/shared/PDF-functions.ts`; retained existing behavior.

Newly Applied
- Version bump to `0.0.49` in `package.json` and `package-lock.json` while keeping fork-specific metadata and scripts.
- FA1/FA2/FA3 generators now pass `P_PMarzy` to downstream generation to support marza/OSS handling.
- Payment sections now render multiple bank accounts row-wise in `Platnosc.ts` (FA1/FA2/FA3).
- Wiersze tables: `P_12_XII` now uses `FormatTyp.Percentage`, and `KursWaluty` column is conditional via `getDifferentColumnsValue` (FA1/FA2/FA3).
- VAT summaries include OSS when `P_14_5` is present and incorporate `P_14_5` into totals (FA1/FA2/FA3).
- `Podmiot2Podmiot2K` now inserts a separator line before "Nabywca" (FA1/FA2/FA3).
- `Podmiot3` udział is formatted as a percentage instead of currency (FA1).
- Contact phone values now use `_text` in `PodmiotDaneKontaktowe` (FA1).

Conflicts And Resolutions
- `package.json`, `package-lock.json`: preserved fork package identity and scripts; applied fork version policy (`0.0.49`).
- `Podmiot1Podmiot1K` (FA1/FA2/FA3) and specs: kept legacy-aware status mapping; adopted upstream output shape (push first column stack directly) and updated tests.
- `Podmiot2Podmiot2K` (FA1/FA2): condition for corrected content aligned to `podmiot2K.DaneIdentyfikacyjne`; updated tests accordingly.
- `Podmiot2Podmiot2K` (FA3): retained fork’s broader corrected-content condition (address/ID/dane identyfikacyjne) and column reset; updated tests.
- `Podmiot2` (FA3): kept fork JST/GV logic that supports top-level and contact-level fields.
- `Wiersze.spec.ts` (FA1/FA2/FA3): added `getDifferentColumnsValue` mocks and adjusted expectations.
- `src/shared/PDF-functions.ts`: resolved import-format conflict without changing behavior.

Follow-up Fixes (post-integration)
- Removed duplicate `P_PMarzy` guard in `getTStawkaPodatku` (no behavior change).
- Applied intended filtering in `FA3/Podmioty` by using the filtered list when `Podmiot2.IDNabywcy` is present.

Behavior Changes
- OSS and marza handling is now surfaced in Wiersze and VAT summaries across FA1/FA2/FA3.
- Multiple bank accounts render as paired rows instead of a single two-column block.
- "Nabywca" sections now have an explicit separator line where supported.
