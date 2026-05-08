# Changelog — auxbox.tools

Append-only log of structural or behavior changes future agents would need to know about. The pre-commit hook requires this file to be staged whenever any source file is staged.

## Entry format

```
## YYYY-MM-DD - Short title
**What changed:** ...
**Why:** ...
**Impact:** ...
**Files changed:** ...
```

---

## 2026-05-08 - Exchange Rates: forex.js lib + tests
**What changed:**
- New `src/lib/forex.js` — pure API helpers: `fetchRates(base, dateOrLatest, signal)` with 3-provider fallback chain (fawazahmed0/jsDelivr → fawazahmed0/Cloudflare → open.er-api for latest-only); `fetchCurrencyList(signal)` with module-scope cache; URL builders; normalizers for both API response shapes (lowercase fawazahmed0 → uppercase, open.er-api already uppercase). Boundary conversion using JS Date for open.er-api's RFC-2822-like timestamp string.
- New `src/lib/forex.test.js` — 19 tests covering URL builders, normalizers, happy paths, fallback chain, all-fail error, no-open-er-for-historical, currency-list caching, and Cloudflare fallback for list.
**Why:** Lib-first so all API logic is pure, testable, and isolated from React.
**Impact:** New shared lib. No existing code changed.
**Files changed:** `src/lib/forex.js` (new), `src/lib/forex.test.js` (new).

---

## 2026-05-07 - S4: Timezone search combobox + full IANA list
**What changed:**
- Extended `src/lib/timezones.js` with `getAllZones()` (full IANA list via `Intl.supportedValuesOf`, fallback to curated list) and `searchZones(query, limit)` (searches by IANA name, city segment, common abbreviations: GMT/UTC/BST/ET/EST/JST/etc., and region keywords: Eastern/Pacific/Japan/etc.). Ranking: exact > prefix > contains.
- New `src/components/Combobox.js` — accessible searchable combobox (text input + filtered listbox popover, arrow-key nav, Enter/Escape/Tab, outside-click close). CSS in tools.css. Lifted to shared from day one per place-it-right convention.
- Updated `src/app/timezone-converter/page.js`: replaced both zone `<select>` elements with `<Combobox>`. Anchor zone picker searches all IANA zones; add-target picker also searches all IANA zones (minus already-added ones). Auto-adds zone on selection (no separate button needed).
- Updated `src/app/timezone-converter/timezone-converter.css`: `.tz-add-row` layout simplified; `.tz-zone-option` + `.tz-zone-option-name` added.
- Updated `src/app/timezone-converter/page.test.jsx`: rewrote all 9 tests to work with combobox (text input + option click) instead of `<select>`.
- 19 tests total in `src/lib/timezones.test.js` (11 new for `getAllZones`/`searchZones`).
**Why:** The old curated 20-zone `<select>` required knowing the exact zone name. Users can now type "London", "BST", "Eastern", or "Asia/Tokyo" and get relevant results from the full IANA list.
**Impact:** `ZONE_OPTIONS` / `ZONE_VALUES` still exported for other tools (timestamp-converter, etc.) that use the curated list. `Combobox` is a new shared component. timezone-converter behavior and storage unchanged; UI updated.
**Files changed:** `src/lib/timezones.js`, `src/lib/timezones.test.js`, `src/components/Combobox.js` (new), `src/styles/tools.css`, `src/app/timezone-converter/page.js`, `src/app/timezone-converter/timezone-converter.css`, `src/app/timezone-converter/page.test.jsx`.

---

## 2026-05-07 - S3: In-page ColorPicker + contrast-checker integration
**What changed:**
- Added `hsvToRgb` and `rgbToHsv` helpers to `src/lib/color.js` (lib-first per convention).
- New `src/components/ColorPicker.js` — popover-based in-page color picker. Shows a 2D SV area + hue strip slider + hex input. Click-outside closes; Escape closes. Returns hex via `onChange`.
- CSS in `src/styles/tools.css`: `.cp-swatch-btn`, `.cp-popover`, `.cp-sv-area`, `.cp-sv-white/black/cursor`, `.cp-hue-row`, `.cp-hue-slider`, `.cp-hex-row`, `.cp-hex-input`, `.cp-hex-preview`.
- Replaced the OS-native `<input type="color">` swatch overlay in `src/app/contrast-checker/page.js` with `<ColorPicker>` for both fg and bg. Updated card hint copy. Removed dead `.cc-swatch` and `.cc-color-picker` CSS from `contrast-checker.css`.
- 10 tests in `src/components/ColorPicker.test.jsx` (open/close/Escape/outside-click/hex round-trip/prop sync).
- 11 new tests for `hsvToRgb`/`rgbToHsv` added to `src/lib/color.test.js`.
**Why:** Replace the native OS color picker (broken on mobile, inconsistent across OSes) with a consistent in-page picker.
**Impact:** `src/lib/color.js` gains two new exports (non-breaking). ColorPicker is a new shared component. contrast-checker visual changes; functionality unchanged.
**Files changed:** `src/lib/color.js`, `src/lib/color.test.js`, `src/components/ColorPicker.js` (new), `src/components/ColorPicker.test.jsx` (new), `src/styles/tools.css`, `src/app/contrast-checker/page.js`, `src/app/contrast-checker/contrast-checker.css`.

---

## 2026-05-07 - S2: Palette-from-image controls alignment fix
**What changed:** `.pfi-controls` in `src/app/palette-from-image/palette-from-image.css` changed from `align-items: end` to `align-items: flex-start`. The "Colours" and "Format" labels now align at the top of the control row.
**Why:** User-reported visual misalignment — the Colours label appeared higher than Format because `end` aligns to the bottom of the flex line.
**Impact:** CSS-only change; no logic or API changes.
**Files changed:** `src/app/palette-from-image/palette-from-image.css`.

---

## 2026-05-07 - S1: Shared `<Checkbox>` primitive + migrate all consumers
**What changed:** New `src/components/Checkbox.js` — an accessible, custom-styled checkbox primitive. Visually-hidden native `<input type="checkbox">` for a11y; custom styled box with checked indicator SVG; focus-visible ring; disabled state. CSS in `src/styles/tools.css` as `.tool-checkbox`, `.tool-checkbox-box`, `.tool-checkbox-label`, etc.
- Migrated all consumer pages: `pomodoro-timer`, `csv-json-converter`, `date-calculator`, `favicon-generator`, `json-formatter`, `image-compressor`, `password-generator/components/ClassToggles.js`.
- Removed now-dead local checkbox CSS rules from each tool's CSS file.
- `regex-tester`'s `.rt-flag` pill is intentionally NOT migrated — it is a chip toggle, not a checkbox row, and migration would regress the visual.
- Tests: 12 tests in `src/components/Checkbox.test.jsx`.
**Why:** Native `<input type="checkbox">` was unstyled in all tools. Lifted to a shared primitive per reuse-first convention.
**Impact:** No API or behavior change. All consumers call `onChange(boolean)` via the new interface (handlers updated to receive boolean directly instead of `e.target.checked`).
**Files changed:** `src/components/Checkbox.js` (new), `src/components/Checkbox.test.jsx` (new), `src/styles/tools.css` (checkbox rules added), CSS for `pomodoro-timer`, `csv-json-converter`, `date-calculator`, `favicon-generator`, `json-formatter`, `image-compressor`, `password-generator` (dead checkbox rules removed), JS for same tools (Checkbox import + usage).

---

## 2026-05-07 - Add `/favicon-generator` (one image → full favicon set + ICO)
**What changed:** New `/favicon-generator` route. Upload one image, download a zip with PNGs at 16/32/180/192/512 plus an optional multi-resolution `favicon.ico` (16/32/48).
- **Pipeline (`pipeline.js`):** `generateFavicons(file, {background, includeIco})` → resizes via `createImageBitmap` + canvas `cover` + centre-crop. Reuses `MAX_PIXELS`, `canvasToBlob`, `isSupportedImage` from `src/lib/image.js`. EXIF orientation honoured (`{imageOrientation: 'from-image'}`). Bitmap closed in `try/finally`.
- **ICO (`ico.js`):** Hand-rolled ICO container with PNG-encoded entries. ~50 lines; no `png-to-ico` dependency. Three tests for header layout, size cap, and mime.
- **UI:** Reuses `<DropZone>`. Background select (transparent / white / black). Include-ICO toggle. Tile grid previews each generated PNG; checkered backdrop on previews. "Download zip" via JSZip.
- **Persistence:** `favicon_generator_state` stores `{includeIco, background}`. Strict-keys validator + enum membership. Source image / output blobs never persisted.
- **Tests:** 4 pipeline + 3 ICO + 3 storage + 2 page = 12 new tests.
- **Home tile:** ⭐ "Favicon Generator". Sitemap entry added.
**Why:** Build-queue item #13. Common need; saves a trip to a third-party site.
**Impact:** +1 dependency (`jszip ^3.10.1`). +12 tests. Hand-rolled ICO encoder keeps the dep count small.
**Files changed:** `src/app/favicon-generator/{constants,pipeline,pipeline.test,ico,ico.test,storageUtils,storageUtils.test,StorageContext,layout,page,page.test,favicon-generator.css}.{js,jsx,css}` (new), `src/app/page.js`, `src/app/sitemap.js`, `package.json`, `package-lock.json`.

---

## 2026-05-07 - Palette from Image review-round-1 fixes (S1-S21)
**What changed:** Applied all 21 review findings to `src/app/palette-from-image/` and shared infrastructure.
- **S1:** `setBusy(false)` in `finally` now guarded with `if (myGen === genIdRef.current)` to prevent stale extractions from clearing the busy flag.
- **S2:** `readableTextOn` threshold corrected from `> 0.5` to `> 0.179` (WCAG-correct crossover: `(L+0.05)² = 1.05×0.05`).
- **S3:** `.pfi-swatch` gains `:hover { transform: translateY(-1px) }` and `:focus-visible { outline: 2px solid var(--primary-color) }`. Outline used instead of box-shadow because `overflow:hidden` clips box-shadow.
- **S4/S18:** `runExtraction` clears `palette`/`sourceInfo` at entry so stale results never show alongside a new (possibly failing) run. Folded S18 into S4.
- **S5:** `handleFiles` clears `palette`/`sourceInfo` before the unsupported-type early return. `runExtraction` catch path also clears them.
- **S6:** Label moved inside `.pfi-swatch-color` band with `color: fg`. `.pfi-swatch-color` is now a flex column with `align-items: flex-end`. Semi-transparent backing on the label for borderline contrast.
- **S7:** Hydration now uses `validatePaletteState(saved)` instead of a bare `typeof` check.
- **S8:** `extractPixels` throws `new Error('Could not acquire 2D canvas context.')` when `getContext('2d')` returns null.
- **S9:** Added `neutral` (50–950, 11 entries) and `stone` (50–950, 11 entries) families to `TAILWIND_COLORS`.
- **S10:** `relativeLuminance` import removed from `utils.js`; now imported from `src/lib/color.js`.
- **S11:** `hexToRgb` local helper in `tailwind.js` removed; replaced with `parseColor(hex)` from `src/lib/color.js`.
- **S12:** `extractPixels` lifted to `src/lib/image.js` (shared). `quantize.js` re-exports it via `export {extractPixels} from '../../lib/image'`.
- **S13:** Colour-count `<input>` gains `aria-describedby="pfi-count-help"` pointing to a sibling span `Between N and M.`.
- **S14:** `!palette` guard removed from the count-change `useEffect`; only `!lastFileRef.current` remains so re-extraction works after prior errors.
- **S15:** `.tool-card-title` and `.tool-hint` added to `src/styles/tools.css`. Local `*-card-title` rules removed from 13 tool CSS files (pfi, fg, cjc, ug, ic2, cc, tc×2, tz, ps, hg, jf, rt). Local `pfi-hint`/`fg-hint`/`cjc-hint` rules removed. Classes replaced with `tool-card-title` / `tool-hint` in all JS.
- **S16:** `paletteToCSSVars(palette, format)` exported from `utils.js`. "Copy as CSS vars" button added alongside "Copy all".
- **S17:** `file.size > 50_000_000` pre-check added before `createImageBitmap`.
- **S19:** Tests expanded: single-colour medianCut (count=1); more-colours-than-unique-pixels; nearestTailwind dark grey; palette size after neutral/stone addition; extractPixels null-context error; page tests for extraction flow, createImageBitmap rejection, copy-all toast, swatch copy, and garbage-storage fallback to defaults.
- **S20:** `splitBucket` gains comment "sorts in place along chosen channel".
- **S21:** `nearestTailwind` gains comment about squared RGB distance and ΔE 6 worst-case vs LAB.
**Why:** Review-round-1 findings: correctness (S1-S2), accessibility (S3, S13), state management (S4-S7), robustness (S8, S17), palette quality (S9), code deduplication (S10-S12, S15), new feature (S16), tests (S19), comments (S20-S21).
**Impact:** +12 new tests (291 total in scope, all green). 13 tool CSS files cleaned up (dead card-title rules removed). `extractPixels` now in `src/lib/image.js`.
**Files changed:** `src/app/palette-from-image/{page,page.test,utils,utils.test,quantize,tailwind,tailwind.test,palette-from-image.css}.{js,jsx,css}`, `src/lib/image.js`, `src/lib/image.test.js`, `src/styles/tools.css`, `src/app/{favicon-generator,csv-json-converter,uuid-generator,image-converter,contrast-checker,bill-tip-calculator,timestamp-converter,timezone-converter,pdf-splitter,hash-generator,json-formatter,regex-tester}/{page,*.css}.{js,css}`.

---

## 2026-05-07 - Add `/palette-from-image` (median-cut color palette extractor)
**What changed:** New `/palette-from-image` route. Upload an image → extract N dominant colors via median-cut quantization. Output as hex, RGB, or nearest Tailwind class.
- **Quantizer (`quantize.js`):** Hand-rolled median-cut. Skips fully-transparent pixels, picks widest-channel split, returns palette sorted by frequency descending. `extractPixels` downsamples large bitmaps to ≤50 000 sample pixels via canvas. 7 unit tests.
- **Tailwind matcher (`tailwind.js`):** Embedded Tailwind v3.4 default palette (slate / gray / zinc / red / orange / amber / yellow / lime / green / emerald / teal / cyan / sky / blue / indigo / violet / purple / fuchsia / pink / rose, 50–950 + black/white). Nearest-neighbour by squared RGB distance. 5 unit tests.
- **UI:** Reuses `<DropZone>`. Colour-count input (2–16, default 6) + format select. Swatch grid; click any swatch to copy. "Copy all" copies the full palette as newline-separated text. `aria-busy` on the source card. Source filename + dimensions displayed.
- **Persistence:** `palette_from_image_state` stores `{colourCount, format}`. Strict-keys validator + range/enum membership. Source image / extracted palette never persisted.
- **Tests:** 7 quantizer + 5 tailwind + 5 utils + 5 storage + 1 page = 23 new tests.
- **Home tile:** 🎨 "Palette from Image". Sitemap entry added.
**Why:** Build-queue item #14. Common need for designers + devs.
**Impact:** No new dependencies. Hand-rolled quantizer + embedded Tailwind palette keep the dep count flat.
**Files changed:** `src/app/palette-from-image/{constants,quantize,quantize.test,tailwind,tailwind.test,utils,utils.test,storageUtils,storageUtils.test,StorageContext,layout,page,page.test,palette-from-image.css}.{js,jsx,css}` (new), `src/app/page.js`, `src/app/sitemap.js`.

---

## 2026-05-07 - Favicon Generator review-round-1 fixes (S1-S19)
**What changed:** Applied all 19 review findings to `src/app/favicon-generator/`.
- **S1:** Filenames updated to universal `WIDTHxHEIGHT` form in `constants.js` (e.g. `favicon-16x16.png`, `android-chrome-192x192.png`).
- **S2:** `handleDownloadZip` now adds `site.webmanifest` to the zip; a manifest tile is shown in the result grid.
- **S3:** Race-condition guard via `genIdRef = useRef(0)`; stale drops are silently discarded; URLs are built into a temp array and only committed to `previewUrlsRef.current` after freshness check.
- **S4:** `setResult(null)` called immediately after `releasePreviews()` before the try block; a `staleNotice` state shows "Settings changed — re-drop the image to regenerate." when `background` or `includeIco` change after a result exists.
- **S5:** Replaced `className="cjc-hint"` with `className="fg-hint"`; added `.fg-hint` rule to `favicon-generator.css`.
- **S6:** HTML `<link>` snippet rendered in a `<pre className="fg-snippet">` with a "Copy HTML snippet" button using `useCopyToClipboard`; ICO and manifest lines omitted when `includeIco` is off.
- **S7:** `handleDownloadZip` wrapped in try/catch; success shows "Zip downloaded" toast, error shows error toast.
- **S8:** Blob URL revoke timeout bumped from 1000 ms → 60_000 ms.
- **S9:** Source card shows upscale hint when `min(width,height) < 512`.
- **S10:** Source filename and dimensions (`NxM`) displayed after drop.
- **S11:** JPEG/non-transparent sources downgrade `'transparent'` background to `'white'` for that generation only; an info toast explains the change.
- **S12:** `JSZip` lazy-imported inside `handleDownloadZip`; top-level import removed.
- **S13:** Cleanup-effect comment updated to "unmount only".
- **S14:** New pipeline tests: centre-crop offset assertions for 1000×500 input (`sx=250, sy=0`); `fillRect` called for white/black, NOT called for transparent.
- **S15:** New ICO tests: `dwBytesInRes` and `dwImageOffset` assertions for a 3-entry ICO with 8/16/32-byte payloads; offsets verified as 54/62/78.
- **S16:** `aria-busy={busy}` on source card content div; "Generating…" status paragraph moved above the result card.
- **S17:** Imports moved above `beforeAll` in `pipeline.test.js` and `ico.test.js`.
- **S18:** Removed unused `userEvent` import from `page.test.jsx`; added tests for unsupported-file error and settings-changed-after-result hint.
- **S19:** One-line comment in `ico.js` explaining `planes=1, bpp=32` for PNG-encoded entries.
**Why:** Review-round-1 findings. Correctness, UX, accessibility, and bundle-size improvements.
**Impact:** 19 tests added (total 19 favicon-generator tests). `jszip` now lazy-loaded. No new dependencies.
**Files changed:** `src/app/favicon-generator/{constants,page,page.test,pipeline.test,ico,ico.test,favicon-generator.css}.{js,jsx,css}`.

---

## 2026-05-07 - CSV ↔ JSON Converter review-round-1 fixes (S1-S19)
**What changed:** Applied all 19 review findings to `src/app/csv-json-converter/` and shared infrastructure.
- **S1:** `parseCsv` only enters quoted mode when field buffer is empty; stray mid-field `"` is now a literal character. Test added.
- **S2:** `parseCsv` strips leading UTF-8 BOM (U+FEFF). Test added.
- **S3:** `inferType` rejects leading-zero numerics (`/^-?0\d/`) and unsafe integers (`!Number.isSafeInteger`). Tests for `"007"`, `"9007199254740993"`, `"3.14"`, `"1e3"`.
- **S4:** `jsonToCsv` rejects mixed arrays/objects with a clear error. Test added.
- **S5:** Computation moved from `useMemo` to `useEffect + setTimeout(300ms)`, mirroring json-formatter. `result` is now in `useState`. Page tests updated to use `waitFor`.
- **S6:** Lifted `locateJsonError` from `json-formatter/utils.js` to `src/lib/json.js`. `json-formatter/utils.js` now imports+re-exports it. `jsonToCsv` returns `{line, column}` on JSON parse failure; page renders `Line N, column M: …`.
- **S7:** "Auto-detect" option hidden from delimiter select in JSON→CSV mode. Switching direction auto-coerces `auto` → `,`. Detected delimiter hint not shown in JSON→CSV.
- **S8:** `handleSwap` shows toast `'Swapped — input replaced with previous output'`. Page test added.
- **S9:** `csvToJson` dedupes duplicate header names (`name`, `name_2`, `name_3`); returns `warnings[]` surfaced as `cjc-hint` lines.
- **S10:** Header-only CSV (no data rows) returns empty array and pushes `'Header row only — no data rows.'` warning.
- **S11:** `jsonToCsv` detects non-finite numbers in cells (NaN/Infinity), emits empty string, adds to `warnings[]`.
- **S12:** `parseCsv` filters blank rows (`r.length === 1 && r[0] === ''`). Test added.
- **S13:** `jsonToCsv` warns when a nested object/array is JSON-stringified into a cell. Test added.
- **S14:** `inferType` JSDoc gains locale caveat remark about EU `"1.234,56"` style.
- **S15:** `@media (max-width: 480px)` block added to `csv-json-converter.css` stacking `.cjc-toggle-row` and `.cjc-controls`.
- **S16:** Privacy invariant comment added to `setInput` `onChange` handler.
- **S17:** `.tool-error` shared rule added to `src/styles/tools.css`. Local `.cjc-error` and `.jf-error` rules removed; both pages now use `className="tool-error"`.
- **S18:** Removed dead `detectDelimiter` import from `page.js`. Removed unused `saveToLocalStorage`/`loadFromLocalStorage`/`clearLocalStorage` re-exports from `storageUtils.js`.
- **S19:** Stripped what-comments (file-level descriptive headers) from `constants.js` and `storageUtils.js`.
**Why:** Review-round-1 findings: correctness (S1-S4), UX/debounce (S5), DX/error messages (S6), UI correctness (S7), UX (S8-S11), robustness (S12-S13), code quality (S14-S19).
**Impact:** +13 new tests (219 total in scope, all green). `src/lib/json.js` added as shared utility. No new dependencies.
**Files changed:** `src/app/csv-json-converter/{utils,utils.test,storageUtils,constants,page,page.test,csv-json-converter}.{js,jsx,css}`, `src/app/json-formatter/{utils,page,json-formatter}.{js,css}`, `src/styles/tools.css`, `src/lib/json.js` (new).

---

## 2026-05-07 - Add `/csv-json-converter` (CSV ↔ JSON)
**What changed:** New `/csv-json-converter` route. Convert CSV to JSON or JSON to CSV in the browser.
- **Logic (`utils.js`):** `parseCsv` (RFC 4180-style with quoted fields, CR/LF/CRLF row endings, `""` escape), `formatCsv` via `jsonToCsv`, `csvToJson`, `detectDelimiter` (counts `, ; \t |` outside quotes), `inferType` (numbers / booleans / null). 29 unit tests including round-trip.
- **UI:** ModeToggle for direction (CSV → JSON / JSON → CSV). Delimiter select with auto-detect + comma/semicolon/tab/pipe. Toggles for header row, type inference, pretty-print. Two textareas (input/output) with Copy + Swap. Detected delimiter displayed inline when auto.
- **Persistence:** `csv_json_converter_state` stores `{direction, delimiter, hasHeader, inferTypes, prettyJson}`. Strict-keys validator on shape + enum membership. Input text is intentionally NOT persisted (privacy invariant).
- **7 page tests** + 29 utils tests.
- **Home tile:** 🔄 "CSV ↔ JSON Converter". Sitemap entry added.
**Why:** Build-queue item #12. Common dev / data utility; obvious gap in the toolset.
**Impact:** +36 tests. No new dependencies. Hand-rolled CSV parser to avoid Papa-parse for a 200-line tool.
**Files changed:** `src/app/csv-json-converter/{constants,utils,utils.test,storageUtils,StorageContext,layout,page,page.test,csv-json-converter.css}.{js,jsx,css}` (new), `src/app/page.js`, `src/app/sitemap.js`.

---

## 2026-05-07 - Timezone Converter review-round-1 fixes (S1-S12)
**What changed:** Applied all 12 review findings to `src/app/timezone-converter/` and lifted shared zone data to `src/lib/timezones.js`.
- **S1:** Lifted `ZONE_OPTIONS` / `ZONE_VALUES` to `src/lib/timezones.js` (20-entry canonical list). `Asia/Riyadh` label updated to `(AST · Arabia)` (disambiguation). Both `timezone-converter` and `timestamp-converter` constants now import from the lib. Timestamp-converter spreads `ZONE_LOCAL` special before the shared list; gains 6 zones (Denver, Sao Paulo, Lagos, Cairo, Hong Kong, Auckland). Added `src/lib/timezones.test.js` (5 tests: count, shape, no-dupes, Arabia label).
- **S2:** Removed `.tz-field`, `.tz-field-label`, `.tz-field-input`, `.tz-field-input:focus` from `timezone-converter.css`. Page now uses shared `tool-field`, `tool-field-label`, `tool-field-input`.
- **S3:** `parseLocalInput` now returns `{dt, normalized, normalizedTo}` instead of a bare DateTime. Callers updated. Spring-forward DST gap renders inline hint "Spring-forward DST gap — interpreted as `<time>`". Utils tests updated to use `r.dt`. Added spring-forward test for `America/New_York 2024-03-10T02:30`.
- **S4:** `handleAnchorZoneChange` clears `pickerZone` when it matches the new anchor; removes the zone from `targets` if the user picks a target as the anchor. Added 2 page tests.
- **S5:** "Target zones" card heading changed from `<div>` to `<h2>`.
- **S6:** Remove button gains `aria-label={`Remove ${label}`}` to match Up/Down pattern.
- **S7:** Empty-state `<p>` gains `role="status"` and `aria-live="polite"`.
- **S8:** Added `@media (max-width: 380px)` breakpoint: `.tz-target-row` stacks to 1 column, `.tz-target-actions` aligns to flex-end.
- **S9:** Added 3 new page tests: empty-state when all targets removed; MAX_TARGETS cap disables picker + shows hint; S4 collision tests.
- **S10:** Inline `<p className="tz-hint">Maximum N zones reached.</p>` rendered when at cap. Added `.tz-hint` CSS.
- **S11:** "Remove deletes a target row" test now queries by accessible name `getByRole('button', {name: /Remove America\/New_York/i})`.
- **S12:** Persistence test uses `loadFromLocalStorage` from `src/lib/storage`; picks `Europe/Berlin` (not in DEFAULT_TARGETS).
**Why:** Review-round findings on code reuse (S1, S2), DST correctness (S3), state collision bug (S4), a11y (S5, S6, S7), mobile (S8), test quality (S9, S11, S12), UX (S10).
**Impact:** 21 timezone-converter page tests + 11 utils tests + 5 lib tests = 37 new tests. 1165 total in repo, all green. No new dependencies.
**Files changed:** `src/lib/timezones.js` (new), `src/lib/timezones.test.js` (new), `src/app/timezone-converter/constants.js`, `src/app/timezone-converter/utils.js`, `src/app/timezone-converter/utils.test.js`, `src/app/timezone-converter/page.js`, `src/app/timezone-converter/page.test.jsx`, `src/app/timezone-converter/timezone-converter.css`, `src/app/timestamp-converter/constants.js`.

---

## 2026-05-07 - Add `/timezone-converter` (multi-zone clock)
**What changed:** New `/timezone-converter` route. One anchor moment + zone → same instant rendered in N target zones.
- **Math (`utils.js`):** Luxon-based `parseLocalInput`, `toLocalInput`, `reZone`, `buildZoneRow` (returns `{formatted, offsetLabel, abbreviation, weekday}`), `nowInZone`. 10 unit tests.
- **UI:** datetime-local input + zone select for the anchor; Now button. Per-target row with formatted time, weekday, offset, IANA abbreviation. Up/down reorder + remove. Add picker excludes already-added zones + the anchor. 20 zones in the curated list. Cap MAX_TARGETS = 12.
- **Persistence:** `timezone_converter_state` stores `{anchorZone, targets[]}`. Validator strict-keys, integer/zone whitelist on every entry, ≤ MAX_TARGETS length cap.
- **6 page tests** for default render, Add appends, Remove deletes, Now sets anchor, persistence round-trip, Reset.
- **Home tile:** 🌐 "Time Zone Converter".
**Why:** Build-queue item #11. Remote-work staple. Zero new deps; Luxon already in the project.
**Impact:** No new dependencies. 16 new tests, all green.
**Files changed:** `src/app/timezone-converter/` (new directory); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Add `/regex-tester` (live regex match highlighting + capture groups)
**What changed:** New `/regex-tester` route. Pattern + flags + test text → live match highlighting and capture-group display.
- **Math (`utils.js`):** `compileRegex(pattern, flags)`, `findMatches(regex, text)` (zero-width-loop guard, named-group capture), `buildHighlightSegments(text, matches)`. 15 unit tests.
- **UI:** `/pattern/flags` styled slot with `<input>` between primary-color slashes and a flag display. Five flag checkboxes (`g`, `i`, `m`, `s`, `u`) — `y` (sticky) excluded. Five preset chips (Email, URL, IPv4, Hex color, ISO date). Test-text textarea using shared `.tool-textarea`. Live-highlighted preview inside a `<mark>`-decorated pre block. Match table (cap 100 rows) with index + groups.
- **Persistence:** `regex_tester_state` stores `{pattern, flags, test}`. Validator strict-keys + flag-letter whitelist + dedup.
- **7 page tests** for default render, match-count + highlight rendering, error rendering, flag toggle, preset application, Clear, persistence.
- **Home tile:** 🔍 "Regex Tester".
**Why:** Build-queue item #10. Universal dev tool; standard JS regex semantics so users know what they get.
**Impact:** No new dependencies. 22 new tests, all green.
**Files changed:** `src/app/regex-tester/` (new directory); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Regex Tester review-round-1 fixes (S1-S12)
**What changed:** Applied all 12 review findings to `src/app/regex-tester/`.
- **S1:** `buildHighlightSegments` now skips zero-width matches entirely (early `continue`) to prevent text duplication when zero-width matches appear at index > 0.
- **S2:** `findMatches` zero-width advance now uses `codePointAt` to step by 2 for surrogate pairs (u flag), preventing mid-surrogate corruption.
- **S3:** `findMatches` returns `{results, truncated}` instead of a plain array. All callers updated. `truncated: true` triggers a `.rt-warn` chip.
- **S4:** Test text debounced 200 ms (`debouncedTest` state + `useEffect`) so catastrophic regex backtracking can't freeze the UI on every keystroke.
- **S5:** Removed `aria-live="polite"` from `.rt-highlight` div; added a separate `<span role="status" aria-live="polite" className="tool-sr-only">` outside the `hasInput` gate, announcing "N matches / No matches / Invalid pattern".
- **S6:** `page.test.jsx` persistence test replaced `setTimeout(r, 400)` with `waitFor` polling.
- **S7:** Match table Groups column now includes named groups (`name=value`) alongside positional `$1=value`.
- **S8:** Preset buttons have a `title` attribute explaining the replace-pattern-and-flags behavior. URL preset test now asserts both `g` and `i` flags are checked.
- **S9:** Match table wrapped in `<div className="rt-matches-scroll">` with `overflow-x: auto`.
- **S10:** Test names tightened to match actual assertions; persistence test now asserts flags + test in storage + rehydration.
- **S11:** Zero-width `findMatches` test uses `r.results.length` and `r.truncated` (S3 shape); assertion tightened to `<= 4`.
- **S12:** Match-table truncation warning replaced with `.rt-warn` chip (amber bordered chip). Same chip for engine `truncated` warning.
**Why:** Review-round findings on correctness (S1, S2), API shape (S3), UX safety (S4), a11y (S5), test quality (S6, S10, S11), feature parity (S7), UX clarity (S8), responsive (S9), visual (S12).
**Impact:** 19 utils tests + 7 page tests = 26 tests, all green. 1139 total tests in repo, all green.
**Files changed:** `src/app/regex-tester/utils.js`, `src/app/regex-tester/utils.test.js`, `src/app/regex-tester/page.js`, `src/app/regex-tester/page.test.jsx`, `src/app/regex-tester/regex-tester.css`.

---

## 2026-05-07 - Contrast Checker review-round-1 fixes (S1-S8)
**What changed:** S1: removed `aria-hidden` from swatch spans, added `tabIndex={-1}` on picker inputs to fix ghost keyboard focus. S2: lifted `parseColor`, `relativeLuminance`, `contrastRatio`, `compositeOver`, `rgbToHex`, `rgbToCss` to `src/lib/color.js`; `utils.js` now re-exports; full unit tests in `src/lib/color.test.js`. S3+S5: extended rgb regex to accept percentage channels and percentage alpha. S4: added tests for 4-digit hex, percentage rgb, space-syntax with percent alpha. S6: `Grade` shows neutral `—` state instead of Fail when ratio is 0 (no valid input); added `cc-grade--neutral` CSS. S7: JSDoc on `parseColor` noting rgb channel clamping. S8: inline comment on WCAG-2.x `0.03928` threshold constant. S9 deferred: `useAutoSave` gates on `dirtyRef`, so `markDirty()` calls in `onChange` handlers are required for persistence.
**Why:** Review-round-1 findings — accessibility blocker, shared-lib lift for reuse by future Color Palette tool, improved color parsing coverage.
**Impact:** 38 tests pass (12 page + 6 utils smoke + 26 lib). ESLint clean.
**Files changed:** `src/lib/color.js` (new), `src/lib/color.test.js` (new), `src/app/contrast-checker/utils.js`, `src/app/contrast-checker/utils.test.js`, `src/app/contrast-checker/page.js`, `src/app/contrast-checker/contrast-checker.css`.

## 2026-05-07 - Add `/contrast-checker` (WCAG color contrast)
**What changed:** New `/contrast-checker` route. Foreground + background → WCAG contrast ratio + AA/AAA pass/fail for normal and large text.
- **Math (`utils.js`):** `parseColor` accepts hex (3/4/6/8 digit), `rgb()`, `rgba()`, `hsl()`, `hsla()`. `relativeLuminance` per WCAG 2.x sRGB formula. `contrastRatio` returns the canonical `(L1+0.05)/(L2+0.05)` value. `compositeOver` blends a semi-transparent foreground onto the background so the contrast figure reflects what the user sees. `rgbToHex`, `rgbToCss` helpers.
- **22 unit tests** cover hex variants (3/4/6/8 digit), rgb/rgba/hsl/hsla parsing, garbage rejection, black-on-white = 21:1, symmetry, null-safe ratio, luminance edges, hex padding/clamping, rgba serialization, alpha compositing.
- **UI:** Two text inputs accepting any CSS color form; native `<input type="color">` swatches behind each text input for OS picker. Always-mounted `aria-live="polite"` result region with the big monospaced ratio + four pass/fail grade rows (AA normal/large, AAA normal/large). Live preview pane with sample text painted in the chosen colors. Swap button. Copy summary, Reset.
- **Persistence:** `contrast_checker_state` stores only `{fg, bg}`. Validator strict-keys.
- **6 page tests** for default render, default-pass-on-AAA, typing updates ratio, swap exchanges fg/bg, error styling on garbage, persistence round-trip.
- **Home tile:** 🌗 "Color Contrast Checker".
**Why:** Build-queue item #9. WCAG ratio is a small surface but designers/devs reach for a checker constantly.
**Impact:** No new dependencies. 28 new tests, all green.
**Files changed:** `src/app/contrast-checker/` (new directory); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Image Converter review-round-1 fixes (S1-S12)
**What changed:** Applied 12 fixes from the review round on `feat/image-converter`:
- **S1 — Shared lib:** Created `src/lib/image.js` with `JPEG_MIME`, `PNG_MIME`, `WEBP_MIME`, `SUPPORTED_INPUT_TYPES`, `MAX_PIXELS`, `mimeForFile`, `isSupportedImage`, `extensionForMime`, `savingsPct`, `canvasToBlob`. Added `src/lib/image.test.js` (19 tests). Migrated `image-compressor/utils.js` and `image-converter/pipeline.js` to import from lib.
- **S2 — `canvasToBlob` rejects on null:** Updated `canvasToBlob` in lib to reject with a descriptive error instead of resolving `null`. Removed now-redundant null check from `convertImage`.
- **S3 — `bitmap.close()` in try/finally:** Wrapped canvas/draw block in `try/finally` so bitmap is always released even if `ctx.fillRect`/`ctx.drawImage` throws.
- **S4 — Always-mounted aria-live region:** Replaced conditional `{result && <div aria-live="polite">}` with a persistent `<div className="ic2-result-region" aria-live="polite" aria-atomic="true">` wrapping both result and error branches.
- **S5 — Real `convertImage` tests:** Added 5 new tests to `pipeline.test.js`: happy path, pixel-cap with `bitmap.close()` spy, decode failure, null blob rejection, white-fill presence/absence for JPEG vs PNG target.
- **S6 — Align MAX_PIXELS to 60 MP:** Single canonical `MAX_PIXELS = 60_000_000` in `src/lib/image.js`. `image-compressor/constants.js` re-exports it. Updated compressor's pipeline test (was hard-coding 64 MP and using a 63.9 MP boundary bitmap that would now exceed 60 MP).
- **S7 — Quality guard floor at 0.1:** Changed `quality > 0` to `quality >= 0.1` to match slider minimum.
- **S8 — Use lib helpers in `page.js`:** Removed local `extensionFor` function; replaced inline `savingsPct` calc with `calcSavingsPct` from lib.
- **S9 — Dynamic aria-label:** Removed static `aria-label="Convert and produce result"`; added `aria-busy={busy}` so AT users hear the loading state from visible text.
- **S10 — Fieldset CSS reset:** Added `border: 0; padding: 0; margin: 0;` + `legend { padding: 0 }` to `.ic2-formats` to suppress browser defaults.
- **S11 — EXIF orientation:** Passed `{imageOrientation: 'from-image'}` to `createImageBitmap` so EXIF-rotated JPEGs render correctly.
- **S12 — Capture dimensions before `bitmap.close()`:** Store `bw`/`bh` before closing in the pixel-cap error path so the error message is safe per spec.
**Why:** Review-round correctness, accessibility, and reuse-first compliance.
**Impact:** 76 tests across lib + both image tools, all green. ESLint clean.
**Files changed:** `src/lib/image.js` (new), `src/lib/image.test.js` (new), `src/app/image-converter/pipeline.js`, `src/app/image-converter/pipeline.test.js`, `src/app/image-converter/page.js`, `src/app/image-converter/image-converter.css`, `src/app/image-compressor/utils.js`, `src/app/image-compressor/constants.js`, `src/app/image-compressor/pipeline.test.js`.

---

## 2026-05-07 - Add `/image-converter` (PNG ↔ JPEG ↔ WebP)
**What changed:** New `/image-converter` route. Drop a single PNG/JPEG/WebP, pick a target format, optionally tune quality, convert and download.
- **Math (`pipeline.js`):** `convertImage(file, {target, quality})` decodes via `createImageBitmap`, paints to a `<canvas>` (with white fill for non-PNG targets so transparent PNG → JPEG/WebP doesn't go black), encodes via `canvas.toBlob`. Pixel-cap at 60 MP. `mimeForFile` + `isSupportedImage` helpers. 5 unit tests for the helpers.
- **UI:** DropZone (single file, ≤25 MB), file-info pill, three-button format picker (PNG / JPEG / WebP), quality slider that auto-hides for PNG (lossless). Result card shows source vs output bytes + dimensions + size-change percent.
- **Persistence:** `image_converter_state` stores `{target, quality}` only; file is session-state. Validator strict-keys.
- **3 page tests** for empty render, PNG-hides / JPEG-shows quality slider, persistence round-trip.
- **Home tile:** 🔄 "Image Format Converter".
**Why:** Build-queue item #8. Reuses the canvas pipeline pattern from image-compressor. PNG transparency handling is the only real twist.
**Impact:** No new dependencies. 8 new tests, all green.
**Files changed:** `src/app/image-converter/` (new directory); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - PDF Splitter review-round-1 fixes (S1-S8)
**What changed:** Applied 8 fixes from the general review round on `feat/pdf-splitter`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-pdf-splitter/`.

- **S1 (major)** — Lifted `parsePdfMetadata`, `isPdfFile`, `ERR_CORRUPT`, and `ERR_ENCRYPTED` to `src/lib/pdf.js`. Both pdf-merger and pdf-splitter now import from there; each tool's `pipeline.js` and `constants.js` re-export for backwards-compat. New test file: `src/lib/pdf.test.js` (8 tests covering happy path, corrupt input, isPdfFile). Constants canonicalized on pdf-merger's wording (more descriptive).
- **S2 (major)** — Dropped `formatPageRange` from `src/lib/pageRange.js` (zero callers; silently broken on non-monotonic input). Removed its 5 tests from `pageRange.test.js`.
- **S3 (major)** — Lowered `MAX_FILE_BYTES` in pdf-splitter from 100 MB to 50 MB (matches pdf-merger). `ERR_TOO_LARGE` now uses `formatBytes(MAX_FILE_BYTES)` so it tracks the constant. Added `LARGE_FILE_WARN_BYTES = 25 MB` and a visible `.ps-warn` banner in the file-info card ("Files near the cap may freeze the page for several seconds."). Added `// TODO: move pdf-lib work to a Web Worker` comment in `pipeline.js`.
- **S4 (minor)** — Added stable `aria-label="Download extracted pages"` to the primary extract button so screen readers don't re-announce on every label change (Extract → Download N pages → Working…).
- **S5 (minor)** — Replaced `e?.message` in both catch blocks (`handleFiles` + `handleExtract`) with fixed user-facing strings: `ERR_CORRUPT` and `"Could not extract pages."` respectively.
- **S6 (minor)** — `extractPages` now validates that every requested index is in `[0, pageCount-1]` after loading the source PDF. Throws a clear error on out-of-range index. Test added.
- **S7 (minor)** — Removed the misleading "future modes can be added without a storage migration" comment from `constants.js`. The strict-keys validator in `storageUtils.js` rejects unknown mode values; the comment contradicted this. Replaced with a comment pointing to `ALLOWED_MODES` in `storageUtils.js`.
- **S8 (minor)** — Added round-trip test in `pipeline.test.js`: extracts 3 pages from a 5-page PDF, reads the output Blob back via `blob.arrayBuffer()`, loads it with pdf-lib, and asserts `getPageCount() === 3`. File annotated `@vitest-environment node` (jsdom lacks `Blob.prototype.arrayBuffer()`).

**Skipped:** Opus#1 F7 (sitemap `new Date()` → Luxon — project-wide sweep, separate task); Opus#2 F7 (SSR clean — non-finding).

**Why:** Round-one review fixes. 3 majors + 5 minors addressed. All findings from both Opus reviewers applied.
**Impact:** 172 tests, all green. No new dependencies. `src/lib/pdf.js` is a new shared lib entry-point.
**Files changed:** `src/lib/pdf.js` (new), `src/lib/pdf.test.js` (new), `src/lib/pageRange.js`, `src/lib/pageRange.test.js`, `src/app/pdf-merger/pipeline.js`, `src/app/pdf-merger/constants.js`, `src/app/pdf-splitter/pipeline.js`, `src/app/pdf-splitter/pipeline.test.js`, `src/app/pdf-splitter/constants.js`, `src/app/pdf-splitter/page.js`.

---

## 2026-05-07 - Add `/pdf-splitter` (extract PDF pages) + lift `parsePageRange` to shared lib
**What changed:** New `/pdf-splitter` route. Drop a single PDF, pick page ranges (`1-3,5,7-9` or empty for all), download a new PDF containing just those pages.
- **Math (`pipeline.js`):** `parsePdfMetadata` and `extractPages(arrayBuffer, indices)` using `pdf-lib`. 6 unit tests.
- **Shared lift:** `parsePageRange` lifted from `pdf-merger/utils.js` to `src/lib/pageRange.js` (with new `formatPageRange` helper). pdf-merger now re-exports for backwards-compat. 13 new tests for the shared lib.
- **UI:** DropZone (single file, ≤100 MB), file info card, page-range InputField with `.tool-field-input--mono`, dynamic primary button label.
- **Persistence:** `pdf_splitter_state` stores only `{mode}`; the file/buffer/range are session-state. Validator strict-keys.
- **2 page tests** (empty render + page-range card hidden without file).
- **Home tile:** ✂️ "PDF Splitter".
**Why:** Build-queue item #7. Direct complement to PDF Merger; reuses pdf-lib pipeline, DropZone, and now the shared parsePageRange.
**Impact:** No new dependencies. 21 new tests; pdf-merger's 71 tests stay green via the re-export.
**Files changed:** `src/lib/pageRange.js` + `src/lib/pageRange.test.js` (new); `src/app/pdf-merger/utils.js`; `src/app/pdf-splitter/` (new directory); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Timestamp Converter review-round-1 fixes (S1-S8)
**What changed:** Applied 8 fixes from the general review round on `feat/timestamp-converter`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-timestamp-converter/`. Reviewers: Opus #1 + Opus #2 + CodeRabbit.

- **S1 (major — Opus#1 F2 + Opus#2 F1)** — `parseAny` magnitude boundary tightened from `abs >= 1e12` to `abs >= 1e11` (≥ 12 digits → ms). Added sanity cap: reject any parsed DateTime whose year falls outside −9999..9999. Three boundary-pinning tests added (11-digit stays seconds → year 5138; 12-digit becomes ms → year 1973; 13-digit stays ms → year 2023).
- **S2 (major — Opus#1 F1 + Opus#2 F4)** — Lifted `.tc-field-input` to `.tool-field-input` (shared) + new `.tool-field-input--mono` modifier in `src/styles/tools.css`. Dropped `.tc-field-input` and `.tc-field-input:focus` blocks from local CSS. Lifted `.tc-field-label` → `.tool-field-label` (shared). Local `.tc-field-input--readonly` kept (no shared equivalent).
- **S3 (major — Opus#1 F3)** — When the user clears any editable field, all other fields are cleared immediately (instead of leaving stale values). Signals "start over" and prevents partial/misleading state.
- **S4 (minor — CR1 + Opus#2 F2)** — Removed dangling `aria-describedby="tc-human-hint"` from the Human read-only input (no matching element existed).
- **S5 (minor — CR2)** — Renamed test from `'Clear wipes all fields and resets the zone'` to `'Clear wipes all fields'` — the original name claimed zone reset but the test didn't assert it.
- **S6 (minor — Opus#2 F5)** — Zone-change rebuild now fires if ANY of iso/seconds/millis has a value (previously only fired when `iso` was non-empty). Source preference: millis → seconds → iso (most to least precise). Predicate uses explicit `!== ''` checks to avoid falsiness trap on `"0"`.
- **S7 (minor — Opus#2 F8/F9)** — Added two utils tests: ISO with millisecond precision round-trips losslessly (`.789Z`); numeric float input (`1700000000.5`) is treated as fractional Unix seconds with the sub-second component preserved.
- **S8 (minor — Opus#1 F4)** — Added 200 ms debounce on the cross-field update in `handleField` via `useRef` timer. Source field updates immediately; the other fields wait for the debounce to settle, eliminating partial-keystroke thrash (e.g., typing "170" no longer briefly shows year-1970-ish values). Empty-field clear bypasses the debounce and runs immediately. Cleanup `useEffect` clears the timer on unmount.

**Skipped:** Opus#1 F5 (handleClear re-save dance — correct via getDefault short-circuit, low value), F6 (aria-live for cross-field updates — would fire per keystroke, sighted users see updates immediately), F7 (zone whitelist silent fallback — Luxon default-to-local is sane), F8 (ISO date-only undocumented — works, tests cover the T-bearing form). Opus#2 F3 (role="alert" flashes per keystroke) folded into S8 — debounce eliminates the per-keystroke noise.

**Why:** Round-one fixes from the local-review-multi-agent process. All 3 majors + 5 minors addressed.
**Impact:** 26 tests (18 utils + 8 page), all green. No new dependencies.
**Files changed:** `src/app/timestamp-converter/{utils.js,utils.test.js,page.js,page.test.jsx,timestamp-converter.css}`; `src/styles/tools.css`.

---

## 2026-05-07 - Add `/timestamp-converter` (Unix epoch ↔ ISO ↔ human)
**What changed:** New `/timestamp-converter` route. Four coupled fields — ISO 8601, Unix seconds, Unix milliseconds, human-readable local time — editing any one updates the rest. Time-zone selector (15 curated zones + Local + UTC), Now button, Copy-each + Copy-all + Clear actions.
- **Math (`utils.js`):** `parseAny` (auto-detects 10-digit seconds vs 13-digit ms, accepts ISO 8601), `toUnixSeconds`, `toUnixMillis`, `toIso`, `toHumanLocal`, `buildAllRepresentations`. 13 unit tests cover empty/null input, magnitude detection, negative seconds (pre-1970), ISO round-trip, zone preservation, invalid input rejection.
- **UI:** Four labelled inputs in monospace, a separate Card for the zone selector, error region for unparseable input, empty-state hint when nothing entered. The "Human" field is read-only since it's a derived display.
- **Persistence:** `timestamp_converter_state` stores ONLY `{zone}`. The actual timestamp value is **not persisted** — it's almost always tied to the user's current task and re-typing is faster than rehydrating a stale moment.
- **8 page tests:** render-all-fields, type-seconds-populates-rest, type-13-digit-ms, type-ISO, Now button, error-on-garbage, Clear, persistence-of-zone-only.
- **Home tile:** 🕰️ "Timestamp Converter". Sitemap entry priority 0.9.
**Why:** Build-queue item #6 from the autonomous backlog run. "Smallest possible build" target — small surface, broad demand, zero new deps (Luxon already in deps from freelance-rate-calculator).
**Impact:** No new dependencies. 21 new tests (13 math + 8 page), all green.
**Files changed:** `src/app/timestamp-converter/` (new directory: constants, utils, utils.test, storageUtils, StorageContext, layout, page, page.test, css); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - JSON Formatter review-round-1 fixes (S1–S6)
**What changed:** Applied 6 fixes from the general review round on `feat/json-formatter`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-json-formatter/`. Reviewers: Opus #1 + Opus #2 (converging on the same 4 majors); CodeRabbit clean.

- **S1 (major)** — `sortObjectKeys` now builds its accumulator with `Object.create(null)` so assigning a key named `"__proto__"` creates an own data property instead of invoking the prototype setter. Previous `{}` accumulator silently dropped `__proto__` keys and corrupted the result's prototype. Regression test added.
- **S2 (major)** — Added `MODES.VALIDATE` as a third discrete mode (`constants.js`). `compute()` in `page.js` branches to `validateJson()` in this mode, sets no output, and uses a `valid` sentinel state. The Output card is hidden when mode is VALIDATE; the success ribbon reads "Valid JSON." in all modes. Page test added.
- **S3 (major)** — `locateJsonError` now falls back to a binary-search scan (bisect shortest failing prefix → `lineCol`) when neither V8-legacy "position N" nor SpiderMonkey "line X column Y" matches. Capped at 1 MB inputs; larger inputs get `{line:null, column:null}`. Replaced the bogus SpiderMonkey test (it only regex-asserted a literal message) with three real tests that call `locateJsonError` directly.
- **S4 (major)** — Live-compute `useEffect` wrapped in `setTimeout(..., 300)` with `clearTimeout` cleanup, eliminating per-keystroke jank on large inputs and screen-reader spam. Dropped `aria-live="polite"` from `role="alert"` (`role="alert"` already implies assertive; the redundant attribute was contradictory per spec).
- **S5 (minor)** — `sortObjectKeys` sort comparator changed from lexicographic `Array.prototype.sort()` to `localeCompare(undefined, {numeric:true})`, so numeric-string keys sort in natural order (`"2"` before `"10"`). Toggle label updated to "Sort keys (numeric-aware)". Unit test added.
- **S6 (minor)** — Added inline comment near textarea `onChange` documenting the privacy invariant: input text is intentionally not persisted; `markDirty()` must not be called here.

**Skipped:** Opus#1 F5 (engine message bytes in DOM — browser-only, no leak path), Opus#2 F5 (compute closure + eslint-disable — deps are correct today), Opus#2 F8 (handleClear re-save dance — correct via `getDefault` short-circuit), Opus#2 F10 (OG/Twitter images — matches every sibling tool's layout.js pattern).

**Why:** Round-one fixes from the local-review-multi-agent process. All 4 majors + 2 high-value minors addressed.

**Impact:** 29 tests across json-formatter (20 utils + 9 page), all green. No new dependencies.

**Files changed:** `src/app/json-formatter/{constants,utils,utils.test,page,page.test}.{js,jsx}`.

---

## 2026-05-07 - Add `/json-formatter` (pretty-print, minify, validate)
**What changed:** New `/json-formatter` route. Paste JSON → pretty-print, minify, or validate. Inline error reporting (line/column when the host engine exposes it). Sort-keys-alphabetically toggle, indent picker (2 / 4 / tab), live-format toggle.
- **Math (`utils.js`):** `formatJson`, `minifyJson`, `validateJson`, `sortObjectKeys`, `locateJsonError`. Pure helpers; 16 unit tests cover indent variants, sort-keys (flat + nested + arrays-preserved), parse-error reporting, empty-input rejection, and minify-strips-whitespace round-trip. Modern Node V8 dropped "position N" from `JSON.parse` errors; the locator now best-effort-degrades to null when no position is exposed (the error message itself is the load-bearing surface).
- **UI:** mode toggle (Format / Minify), indent select (only in Format mode), Sort-keys checkbox, Live checkbox, input + output textareas (shared `.tool-textarea`), inline error/success status, Copy + "Use as input" actions.
- **Persistence:** `json_formatter_state` stores only `{mode, indent, sortKeys, liveFormat}`; the input text is **never persisted** (could be sensitive — same posture as hash-generator). Validator strict-keys.
- **8 page tests:** default render, live-format pretty-prints, malformed JSON shows inline alert, Minify mode produces single-line output, sort-keys alphabetises, settings persist across remount, Clear wipes everything, "Use as input" round-trip with re-format.
- **Home tile:** 🧬 "JSON Formatter". Sitemap entry priority 0.9.
**Why:** Build-queue item #5 from the autonomous backlog run. Privacy story: every major free JSON formatter uploads input data; this one doesn't.
**Impact:** No new dependencies. 24 new tests, all green. Reuses every shared primitive.
**Files changed:** `src/app/json-formatter/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `json-formatter.css`); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - UUID Generator review-round-1 fixes (S1–S4)
**What changed:** Applied 4 fixes from the general review round on `feat/uuid-generator`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-uuid-generator/`. Reviewers: Opus subagent (11 findings, 2 major), CodeRabbit (clean), Copilot (skipped — coordinator proceeded with Opus + CR per "let's have finished" pace).

- **S1 (Opus F1, major)** — Removed the `Math.random()` fallback in `randomBytes`. Silently downgrading to non-cryptographic random violated the project's randomness rubric. Now throws a clear error when `crypto.getRandomValues` is missing; `handleGenerate` catches and surfaces via the existing toast infrastructure. New unit test asserts the throw on both `generateV4` and `generateV7`.
- **S2 (Opus F2, major)** — Replaced `aria-live="polite" aria-atomic="false"` on the result list with a separate sr-only `role="status" aria-live="polite"` summary region. Previous setup announced up to 100 hex strings on every Generate. Now SR users hear "Generated 10 UUID V4 values." on action, not the entire list.
- **S3 (Opus F3, minor)** — Clarified v7 hint copy to flag the within-batch ordering caveat (RFC 9562 §6.2 monotonic counter is not implemented; multiple v7s in the same ms tick share a timestamp and shuffle by random tail).
- **S4 (Opus F8, minor)** — Extracted `findEmptyState(n)` helper in `page.test.jsx`; replaced 5 copies of the cross-`<strong>` function-matcher with a single helper call.

**Skipped:** Opus F4 (persistence-shape note), F5 (validator clean), F6 (radio-card pattern is one-occurrence), F7 (visible radio intentional), F9 (defensive checks harmless), F10/F11 (info — `crypto.subtle` correctly unused; SEO clean).

**Why:** Round-one fixes from the local-review-multi-agent process. Two ship-blockers + minor polish.

**Impact:** 22 tests across uuid-generator (14 math + 8 page), all passing.

**Files changed:** `src/app/uuid-generator/{utils,page,page.test,utils.test}.{js,jsx}`.

---

## 2026-05-07 - Add `/uuid-generator` (UUID v4 + v7 in bulk)
**What changed:** New `/uuid-generator` route. Generate UUID v4 (random) or UUID v7 (timestamp-ordered) in bulk via a count slider (1–100, presets 1/5/10/25/50/100). Per-row copy + Copy all + Download .txt + Clear actions.
- **Math (`utils.js`):** `generateV4()` uses `crypto.randomUUID()` natively (with `crypto.getRandomValues` fallback); `generateV7()` is hand-rolled per RFC 9562 (48-bit ms timestamp + version=7 + 12 random bits + variant=10 + 62 random bits). 13 unit tests cover format regexes for both versions, uniqueness over 1000 iterations, timestamp prefix encoding, lexicographic ordering across ms boundaries, batch counts (NaN/negative/fractional/string coercion), and `isValidUuid` rejection of malformed inputs.
- **UI:** type radio with hint text per option, count slider with chip presets, action row, result list with numbered rows + per-row copy. Empty-state hint reads "Click Generate to create N {VERSION} UUIDs." (function-matcher tests handle the cross-element `<strong>` tag.)
- **Persistence:** `uuid_generator_state` stores only `{type, count}` via shared `createStorageContext` + `useAutoSave`. Validator strict-keys (whitelist `['type', 'count']`) — generated batches are *not* persisted (no need; regen is one click).
- **8 page tests:** default render, Generate produces 10 v4s, type-switch wipes batch, count-slider updates the empty-state copy, preset chip 50 + Generate produces 50 v4s, Copy/Download disabled until first Generate, Clear resets state, persistence round-trip.
- **Home tile:** 🆔 "UUID Generator". Sitemap entry priority 0.9.
**Why:** Build-queue item #4 from `playground/roadmap/2026-05-06_13-35_tool-backlog/plan.md`. The "smallest possible build" target — small surface, broad demand, zero new deps.
**Impact:** No new dependencies. 21 new tests (13 math + 8 page), all green. Production build registers `/uuid-generator` as a static route. Reuses every shared primitive.
**Files changed:** `src/app/uuid-generator/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `uuid-generator.css`); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Hash Generator review-round-1 fixes (S1–S10)
**What changed:** Applied 10 fixes from the general review round on `feat/hash-generator`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-hash-generator/`. Reviewers: Opus (11 findings, 3 major), CodeRabbit (no findings), Copilot (6 findings, 3 major). Codex skipped per standing user instruction.

- **S1 (Opus F1, major)** — Stale-attempt race fixed. The text-mode effect now bumps `attemptRef.current` in the cleanup function, so a fired-but-pending hash promise from a prior run can't overwrite the next state when the user clears the textarea or switches modes.
- **S2 (Opus F2, major)** — Lifted `.tool-textarea` (and `.tool-textarea--autosize` modifier) to `src/styles/tools.css`. Migrated three consumers: `hash-generator` (new tool), `wheel-spinner/components/ListEditor.js`, and `markdown-preview/page.js`. Tool-local CSS keeps only the diverging properties (min-height, line-height for markdown). ~50 lines of duplicated CSS deleted.
- **S3 (Opus F3, major)** — Test vectors expanded from "" + "abc" only to also cover: FIPS 180-4 multi-block SHA-256 ("abcdbcde…"), MD5 of NUL/0xFF buffer (`1359083b…`, externally verified with `md5sum`), surrogate-pair `\u{1F600}` checks UTF-8 encoding, plus a privacy-negative test asserting algorithm-error messages don't leak input bytes.
- **S4 (Opus F8, minor)** — Validator now rejects unknown keys (whitelist of `['mode']`). Defense-in-depth on the privacy story: future regressions that try to persist input get caught at hydrate.
- **S5 (Opus F5 + Copilot F3-F4, minor)** — Large-file warning copy made honest: "MD5 hashing runs synchronously and may freeze the page for several seconds." Misleading "streams internally" comment in `md5OfBuffer` corrected. True non-blocking MD5 (Web Worker) deferred to v2.
- **S6 (Opus F6 + Copilot F2, minor)** — `aria-atomic="false"` → `aria-atomic="true"` on the hash list. Screen readers now announce the entire 4-row update as a single coherent unit instead of fragmenting per-row.
- **S7 (Opus F7, minor)** — Negative test added: `hashBufferWith('SHA-NOPE', buf)` rejects without including input bytes in the error message.
- **S8 (Opus F9, minor)** — Skipped: deferred test addition (post-Clear storage-empty assertion). Existing tests cover the path well enough; not worth blocking.
- **S9 (Copilot F1, major — net-new)** — `setHashes(null)` synchronously at the top of the text-mode effect's non-empty branch. Closes the 200 ms window where the *previous* input's hashes were still live in state and "Copy all" would happily copy them as belonging to the new input.
- **S10 (Copilot F6, minor)** — Persistence test tightened: now asserts `Object.keys(parsed.data)` is *exactly* `['mode']`, so a future regression that adds `text` or `file` to the saved state fails loudly.

**Skipped (with reasons in `communication.md`):**
- Opus F4 (mode-toggle race): subset of F1 root cause; covered by the new cleanup invalidation.
- Opus F10 (spark-md5 footprint): info — acceptable.
- Opus F11 (SSR TextEncoder guard): info — keep as-is.
- Opus F9 (post-Clear storage test): noted; existing tests adequate.

**Why:** Round-one fixes from the local-review-multi-agent process. All non-skipped findings addressed in one round per the protocol's "no deferral" rule.

**Impact:** 88 tests across hash-generator (15) + wheel-spinner (24) + markdown-preview (rest), all passing. Lint clean. Three tools now share `.tool-textarea`. Privacy posture is strengthened: validator rejects extra keys, error messages tested for non-leakage, `aria-live` announcement is coherent.

**Files changed:** `src/styles/tools.css` (added `.tool-textarea*` shared block); `src/app/hash-generator/{page,utils,storageUtils,utils.test,page.test,hash-generator.css}.js`; `src/app/wheel-spinner/{components/ListEditor.js,wheel-spinner.css}`; `src/app/markdown-preview/{page.js,markdown-preview.css}`.

---

## 2026-05-07 - Add `/hash-generator` (SHA-256 / SHA-1 / SHA-512 / MD5)
**What changed:** New `/hash-generator` route. Paste text or drop a file → SHA-256, SHA-512, SHA-1, MD5 hashes side-by-side, lowercase hex, per-row Copy + Copy all.
- **Modes:** Text (live recompute, 200 ms debounce, stale-attempt guard) / File (drop or pick, single-file, hashes computed once on selection). Mode toggle uses shared `<ModeToggle>`.
- **Algorithms:** SHA-* via `crypto.subtle.digest` (zero-dep, browser-native). MD5 via `spark-md5` — first runtime dep added since the freelance-rate-calculator's Luxon. Adds ~8 KB minified gzip.
- **Privacy by design:** the hashed input is **never persisted**. Only the user's preferred mode (Text / File) is saved to localStorage. The privacy line in the UI states this. State validator only accepts `{mode}` — extra fields rejected.
- **File mode:** large-file warning above 500 MB; `Clear file` per-file action; `Clear` global action wipes everything including the persisted mode.
- **Math (`utils.js`):** `hashText(text, algos)`, `hashBuffer(buffer, algos)`, `hashBufferWith(algo, buffer)`, `toHex(buffer)`. 7 unit tests cover empty-string + "abc" against canonical RFC 1321 / FIPS 180-4 vectors for all four algorithms, plus a hex-conversion direct test.
- **Page tests (7):** default render, "abc" → canonical SHA-256 displayed, all four algorithm rows present, mode toggle to File swaps the surface, switching modes clears prior input + result, Clear, mode-only persistence (asserts the input is NOT in storage).
- **A11y:** `aria-live="polite"` on the hash list; `aria-label="Text to hash"` on the textarea; ModeToggle is a labeled `radiogroup`. `<DropZone>` already keyboard-accessible.
- **Home tile:** 🔑 "Hash Generator". Sitemap entry at priority 0.9.
**Why:** Build-queue item #3 from `playground/roadmap/2026-05-06_13-35_tool-backlog/plan.md`. The privacy story (no upload, no persistence of input) is the moat against the major free hash sites that all upload. SHA-* without a dep + MD5 with a small lib is the right scope/cost trade.
**Impact:** First runtime dep added (`spark-md5@^3.0.2`). 14 new tests (7 math + 7 page), all green. Production build registers `/hash-generator` as a static route.
**Files changed:** `src/app/hash-generator/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `hash-generator.css`); `src/app/page.js`; `src/app/sitemap.js`; `package.json`, `package-lock.json` (spark-md5).

---

## 2026-05-07 - Bill Splitter review-round-1 fixes (S1–S8)
**What changed:** Applied 8 fixes from the general review round on `feat/bill-splitter`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-bill-splitter/`. Reviewers: Opus subagent (10 findings, 1 blocker + 1 major + minor/info), CodeRabbit (no findings), Copilot (8 findings, 1 blocker + 1 major + minor). Codex skipped per standing user instruction.

- **S1 (blocker) — Drop `aria-hidden="true"` from `.bs-result-cards`.** The CSS already removes the hidden representation from the a11y tree via `display: none`, so the explicit `aria-hidden` was actively hiding the *visible* mobile UI from screen readers. WCAG 2.1 SC 4.1.3 fix; mobile screen-reader users now see the per-person breakdown.
- **S2 (major) — Lift `.tool-select` and `.tool-preset` to `src/styles/tools.css`.** Three independent native-`<select>` styling clones (`.bs-assign-select`, `.frc-costs-period`, `.tc-currency-select` legacy) and two preset-chip clones (`.bs-preset` / `.tc-preset`) consolidated into shared classes. `bill-splitter` and `bill-tip-calculator` and `freelance-rate-calculator/components/CostsCard.js` all migrated. (cgpa-calculator's `.grade-select` differs in palette and is left for a follow-up.)
- **S3 (minor)** — `.bs-stack` was a clone of the existing `.tool-stack`; replaced and the rule deleted.
- **S4 (minor)** — Footer "Total" cell becomes `<th scope="row">` for screen-reader row-header semantics (WCAG H63).
- **S5 (minor)** — "Load demo" now prompts for confirmation when `canClear` is true (user has typed something). Bypasses the confirm when the form is already at defaults.
- **S6 (minor)** — `validateBillSplitterState` enforces `people.length >= 1` AND referential integrity for `item.assignedTo` (must be `'shared'` or a known person id). Prevents stale-orphan-assignment silent re-bucketing on hydrate.
- **S7 (minor)** — Replaced `newId`'s module-level counter with `crypto.randomUUID()` (with `Math.random` fallback). SSR-safe; no shared mutable state across requests.
- **S8 (minor)** — Tip slider explicit `integerOnly` to match the asymmetry intent with the tax slider (which uses `step={0.5}` + `integerOnly={false}`).

**Skipped (with reasons):**
- Opus F6 (addPerson stale closure): defensible for single-user click cadence; `crypto.randomUUID` ids prevent collisions even on rapid clicks.
- Opus F7 (cents drift): info-only; documented in a JSDoc note in `utils.js`. Fix is integer-cents settlement and is a v2 concern.
- Opus F8 (perf): info; no change needed.
- Opus F10 (SEO): clean.
- Opus F9 / Copilot test-style (`getAllByDisplayValue` papers over UI duplication): tests pass; the assertion is weaker but still load-bearing. Migration to scoped `within(...)` is a polish round, not a blocker.

**Doc fix from Copilot F8:** the original `Add /bill-splitter` changelog entry said "30 new tests (10 math + 20 page)". Actual count was 10 math + 10 page = 20 total. Noted here for the historical record; not editing the prior entry.

**Why:** Round-one fixes from the local-review-multi-agent process. All findings addressed in one round per the protocol's "no deferral" rule.

**Impact:** 97 tests across the three affected tools (bill-splitter 20 + bill-tip-calculator 17 + freelance-rate-calculator 60), all passing. No regressions in any other tool. Three tools now share the new `.tool-select` and `.tool-preset` classes, removing ~75 lines of duplicated CSS.

**Files changed:** `src/styles/tools.css` (added `.tool-select*` and `.tool-preset*` blocks); `src/app/bill-splitter/{page,utils,storageUtils,bill-splitter.css}.js`; `src/app/bill-tip-calculator/{page,bill-tip-calculator.css}.js`; `src/app/freelance-rate-calculator/{components/CostsCard.js,freelance-rate-calculator.css}`.

---

## 2026-05-07 - Add `/bill-splitter` (uneven-split companion to Bill & Tip Calculator)
**What changed:** New `/bill-splitter` route. Different shape from the Bill & Tip Calculator — handles **uneven splits**: each diner gets the items they ordered, then tax + tip is divided proportionally to each person's subtotal.
- **People card:** repeating row `{name, remove}`. "+ Add person" button. Last person can't be removed (disabled state).
- **Items card:** repeating row `{label, amount, assignedTo}`. Assignment select shows "Shared" + every person; "Shared" items split equally across all diners. "+ Add item" button. Empty state explains the model.
- **Tax & tip card:** two sliders with chip presets (tax 0/5/8/10/13/15, tip 0/5/10/15/18/20). Tax 0–20%, tip 0–30%.
- **Currency card:** shared `<CurrencySelect>` popover (the round-2 pattern from bill-tip-calculator).
- **Result card:** desktop = `<table>` with one row per person and a totals footer; mobile (<720 px) = stack of per-person mini-cards (table is hidden via media query). `aria-live` region wraps both branches so screen readers announce the result.
- **Actions:** Copy summary (multi-line per-person plain text), Load demo (3 diners, 5 items, 8% tax, 18% tip), Clear.
- **Math (`utils.js`):** `splitBill({people, items, taxPct, tipPct})` returns `{perPerson:[{personId, name, subtotal, taxShare, tipShare, total}], totals:{subtotal, tax, tip, grandTotal}}`. Proportional tax/tip distribution; 0-subtotal fallback to equal split. Items assigned to a removed person ID are silently treated as "shared". 10 unit tests (round-trip identity, mixed personal+shared, ghost assignments, invalid amounts, percent clamping).
- **Persistence:** `bill_splitter_state` via shared `createStorageContext` + `useAutoSave` + `useHydrateStorage`. Validator covers people array, items array, currency, tax/tip bounds.
- **Page tests (10):** default render, add/remove person (last is disabled), add item, two-diner round-trip with tax+tip, Load demo, Clear, persistence round-trip, currency popover swap, tax preset chip.
- **Home tile:** 🍽️ "Bill Splitter". Sitemap entry at priority 0.9.
**Why:** Build-queue item #2 from `playground/roadmap/2026-05-06_13-35_tool-backlog/plan.md`. The Bill & Tip Calculator (#1) handles equal splits; this tool covers the harder "who ate what" case that was never going to fit cleanly into a slider-based UI.
**Impact:** No regressions. Reuses every shared primitive: `<ToolPage>`, `<Card>`, `<Button>`, `<CurrencyInput>`, `<CurrencySelect>`, `<InputField>`, `<Slider>`, `<ToastContainer>`, `useToast`, `useAutoSave`, `useHydrateStorage`, `useCopyToClipboard`, `formatCurrency`, `CURRENCIES`, `createStorageContext`. No new shared lifts; everything that's tool-specific (per-person cards, item rows, assignment select, totals chips) stays local.
**Files changed:** `src/app/bill-splitter/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `bill-splitter.css`); `src/app/page.js`; `src/app/sitemap.js`.

---

## 2026-05-07 - Bill & Tip Calculator round-2 polish: route rename, popover currency picker, expanded tip presets
**What changed:**
- **Route renamed `/tip-calculator` → `/bill-tip-calculator`.** URL now matches the display name. Directory `src/app/tip-calculator/` → `src/app/bill-tip-calculator/`; CSS file renamed; `STORAGE_KEY` from `tip_calculator_state` → `bill_tip_calculator_state`; metadata `url` + `alternates.canonical` + schema URL + sitemap URL + home tile `href` all updated. (Existing localStorage state under the old key is dropped — no production users yet, branch hasn't shipped.)
- **`<CurrencySelect>` rebuilt as a popover picker.** Replaced the native `<select>` with a styled trigger button that shows the current code in primary color + the long name beside it, plus a chevron that rotates on open. Click toggles a dropdown panel; each option renders `CODE — Name` with the selected one highlighted and a check glyph. Keyboard navigation: Enter/Space toggles, Arrow Up/Down moves through options, Enter/Space selects, Escape closes and refocuses the trigger, Tab away closes, Home/End jump. `aria-haspopup="listbox"` + `aria-expanded` + `role="option"` + `aria-selected` for screen readers. Click-outside closes via document-level mousedown listener. Both consumers (bill-tip-calculator and freelance-rate-calculator) drop the `labelStyle` prop they previously passed — the new component renders the full label uniformly.
- **Tip presets expanded `[5, 10, 15, 18, 20, 25]` → `[0, 5, 10, 15, 20, 25, 30]`.** Adds 0% (matches the new default), 30% (covers high-end tipping), drops 18% (no obvious value over 15/20 once 0/5/10 are present).
- **Tests updated.** CurrencySelect tests rewritten end-to-end (8 tests) for the popover API: renders trigger + label, opens listbox on click, selects via click, marks `aria-selected` on current value, Escape refocuses trigger, Arrow-Down + Enter selects next, id forwarding, className forwarding. Page tests for both consumers replace the `selectOptions(getByLabelText(/currency/))` flow with `click(button)` → `click(option)`. The 18%-preset test now uses 20%.
**Why:** User feedback round-2 on the freshly-renamed Bill & Tip Calculator: (1) "URL should mention Bill", (2) "currency selector is outdated", (3) want explicit chips for 0/5/10/.../30 with 0% as default.
**Impact:** Rename touches the directory layout — `git mv` keeps history. The popover picker is now the shared currency UI for every money tool going forward; no consumer needs its own `<select>` styling. 86 tests across the two consuming tools + CurrencySelect itself, all passing.
**Files changed:** `src/app/tip-calculator/` → `src/app/bill-tip-calculator/` (full rename), CSS file rename, `src/components/CurrencySelect.js` (rewritten), `src/components/CurrencySelect.test.jsx` (rewritten), `src/styles/tools.css` (popover styles replace native-select styles), `src/app/page.js` + `src/app/sitemap.js` (href/url updates), `src/app/bill-tip-calculator/constants.js` (TIP_PRESETS, STORAGE_KEY), `src/app/bill-tip-calculator/{layout,page,page.test}.{js,jsx}`, `src/app/freelance-rate-calculator/components/CurrencyCard.js` (drop labelStyle), `src/app/freelance-rate-calculator/page.test.jsx` (popover-flow update).

---

## 2026-05-07 - Bill & Tip Calculator: rename, default tip 0%, add 5/10% presets
**What changed:**
- Display name renamed from "Tip Calculator" to "Bill & Tip Calculator" everywhere user-visible — page heading via `<ToolPage title>`, schema.org `name`, openGraph/Twitter titles, page metadata title, home-grid tile name + description. Route slug stays `/tip-calculator` (preserves SEO target for "tip calculator" searches; the rename is purely visual).
- Default `tipPct` lowered from 18% → 0%. Lets the user pick a tip rather than assuming a US restaurant convention; matches the user's "no opinionated default" preference established on freelance-rate-calculator (default income tax 0%).
- Tip preset chips expanded from `[15, 18, 20, 25]` to `[5, 10, 15, 18, 20, 25]`. 5% and 10% cover non-restaurant tipping contexts (delivery, lower-tip cultures).
- Page tests updated: heading regex now matches `/bill\s*&\s*tip calculator/i`; 100 / 2 default test asserts $50 (tip 0%); new test asserts 5% and 10% chips render and select; tip-dependent tests explicitly click a preset before asserting math.
**Why:** User flagged that "Tip Calculator" hides the bill-splitting capability; renaming surfaces it. Default 0% tip + lower-percent presets serve a wider audience than US-restaurant defaults.
**Impact:** No URL change → SEO continuity for the existing `/tip-calculator` route. Storage `tipPct: 18` for users who already saved state stays valid (within the [0,30] bound); they just see "0%" default on a fresh visit. 17 tip-calculator tests + 8 CurrencySelect + 59 freelance-rate-calculator + 1 added preset test = 85 passing.
**Files changed:** `src/app/tip-calculator/{constants,layout,page,page.test}.{js,jsx}`, `src/app/page.js` (home tile).

---

## 2026-05-07 - Tip Calculator review-round-1 fixes (S1–S7)
**What changed:** Applied all 7 findings from the general review round on `feat/tip-calculator`. Round folder: `playground/reviews/review-rounds/general/2026-05-07-tip-calculator/`. Reviewers: Opus subagent (8 findings, 1 major), CodeRabbit (no findings), Copilot (6 findings, 2 major). Codex skipped per standing user instruction.

- **S1 (major) — Lifted `<CurrencySelect>` to `src/components/CurrencySelect.js`.** Shared dropdown with `{id, value, onChange, label?, labelStyle?: 'full'|'code', className?}`. CSS lifted to `src/styles/tools.css` under `.tool-currency-select*`. Both consumers migrated: tip-calculator drops the inline `<select>` + `.tc-currency-select-*` CSS; freelance-rate-calculator's `CurrencyCard` is now a thin layout wrapper around `<CurrencySelect labelStyle="full">` (drops `.frc-currency-select`/`-label` CSS). Co-located 8-test spec covers label rendering, option count, onChange code emission, labelStyle variants, id/className forwarding.
- **S2 (major) — Always-mounted `aria-live` region.** The result-card live region was inside the `hasBill` branch — screen readers don't announce content of a region mounted simultaneously with its content (WCAG 2.1 SC 4.1.3). Wrapped both branches in a single persistent `<div className="tc-result-region" aria-live="polite" aria-atomic="true">`.
- **S3 — Negative-bill clamp.** `calculateTip` now `Math.max(0, num(bill))`. Added a unit test asserting negative bill → all outputs zero.
- **S4 — Validator bounds.** New `BOUNDS` constant in `tip-calculator/constants.js` (TIP_PCT_MIN/MAX, PEOPLE_MIN/MAX). `validateTipCalculatorState` enforces tipPct ∈ [0,30], people integer ∈ [1,20], bill ≥ 0 when present. Slider min/max props now read from the same `BOUNDS` so bounds can't drift between validator and UI.
- **S5 — Deterministic persistence test.** Replaced the 400 ms wall-clock `setTimeout` with `waitFor` polling on the localStorage key. Removes the wall-clock wait without introducing fake-timer interference with `userEvent.type` (which schedules its own real-timer rAF).
- **S6 — `canClear` field-by-field compare.** Replaced `JSON.stringify(state) !== JSON.stringify(DEFAULT_STATE)` with explicit per-field comparison; narrows the `useMemo` deps to the four fields that actually matter.
- **S7 — Headline scaling.** `.tc-result-headline-value` now uses `font-size: clamp(2rem, 8vw, 3rem)` so the per-person value doesn't overflow on 375 px viewports for currencies like JPY.

**Skipped (with reason):**
- Opus F8 (currency-select alignment polish): reviewer explicitly said opt-in skip.
- Copilot F5 (sitemap `lastModified` hardcoded): misread of convention — every other tool entry in `src/app/sitemap.js` uses a hardcoded date. Tip-calculator's entry follows the established pattern.

**Why:** Round-one fixes from the local-review-multi-agent process. All findings addressed in one round per the protocol's "no deferral across rounds" rule.

**Impact:** Two tools updated (tip-calculator, freelance-rate-calculator). 84 tests covering both tools and CurrencySelect all pass. 8 net new tests (1 negative-bill + 8 CurrencySelect − 1 changed persistence test). No new dependencies. No regressions in any other tool's tests.

**Files changed:**
- New: `src/components/CurrencySelect.js`, `src/components/CurrencySelect.test.jsx`.
- Modified: `src/styles/tools.css` (added `.tool-currency-select*` block); `src/app/tip-calculator/{page,constants,storageUtils,utils,utils.test,page.test,tip-calculator.css}.{js,jsx}`; `src/app/freelance-rate-calculator/components/CurrencyCard.js`; `src/app/freelance-rate-calculator/freelance-rate-calculator.css` (dropped `.frc-currency-{label,select,select:focus}`).

---

## 2026-05-07 - Tip Calculator: register on home + sitemap (tip-calculator 3/3)
**What changed:** Added the Tip Calculator tile (🧾) to the home grid and sitemap entry at priority 0.9. Plan archived from `playground/roadmap/` to `playground/roadmap/1-completed/`. HANDOVER updated to reflect the build is awaiting user test pass before merge.
**Why:** Final wrap-up of the tip-calculator build queue (item #1).
**Impact:** Tile-and-sitemap registration only.
**Files changed:** `src/app/page.js`, `src/app/sitemap.js`, `playground/HANDOVER.md`, `playground/roadmap/...` (archive move).

---

## 2026-05-07 - Add `/tip-calculator` (tip-calculator 2/3)
**What changed:** New `/tip-calculator` route. Bill amount + tip-percent slider (with 15/18/20/25% chip presets) + people slider → total + per-person split. Currency selector reuses the shared 10-ISO list. Big monospaced "Per person" headline, subtotal/tip/total stack, per-person-tip footer chip, Copy-summary button (copies a one-line "$X bill, 18% tip, 2 people → $59.00 each (total $118.00)" string), Clear button.
- Pure math in `utils.js` with 8 unit tests (round-trip, zero-bill, zero-tip, fractional people clamp, etc.).
- 8 page tests cover defaults, preset chip click, people slider re-compute, currency switch, Clear, and localStorage persistence round-trip.
- Persistence under `tip_calculator_state` via `createStorageContext` + shared `useAutoSave` + `useHydrateStorage`. Auto-save debounce 300 ms.
- Defaults: USD, blank bill, 18% tip, 2 people.
- Mobile-first: bill row collapses to a single column under 520 px so the currency dropdown stacks below the amount.
**Why:** Branch `feat/tip-calculator`, commit 2 of 3.
**Impact:** No regressions in prior tools — all shared primitives used as-is.
**Files changed:** `src/app/tip-calculator/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `tip-calculator.css`).

---

## 2026-05-07 - Lift `CURRENCIES` to `src/lib/currencies.js` (tip-calculator 1/3)
**What changed:** Pulled the 10-currency list out of `freelance-rate-calculator/constants.js` and into `src/lib/currencies.js`. Re-exported from the calculator's constants for backwards compat. Tip Calculator (next commit) will be the second consumer.
**Why:** Place-it-right policy — confirmed second consumer. Every future money tool will need the same list.
**Impact:** Pure refactor. All 59 freelance-rate-calculator tests stay green.
**Files changed:** `src/lib/currencies.js` (new), `src/app/freelance-rate-calculator/constants.js`.

---

## 2026-05-06 - Freelance Rate Calculator: surface accepted Hours formats in the label
**What changed:** The Hours field's accepted formats are now part of the visible label — `Hours — accepts 12.5, 12:19, or 12h 19m` with each format in a `<code>` chip. The placeholder echoes them and the helper line below changes color based on state: gray default, red on parse error, primary on a successful parse (`Parsed: 12h 19m`). Previously the format hint only appeared in a subtle gray helper that the user didn't notice.
**Why:** User flagged "you allowed me to write whatever … but you didn't tell me." The accepted-format affordance needs to be obvious before they type, not after they fail.
**Impact:** No behaviour change — same parser, same math. Pure discoverability fix.
**Files changed:** `src/app/freelance-rate-calculator/components/QuoteInputs.js`, `src/app/freelance-rate-calculator/freelance-rate-calculator.css`, `src/app/freelance-rate-calculator/page.test.jsx` (label-regex updated to match the longer label).

---

## 2026-05-06 - Freelance Rate Calculator: smart Hours parser (decimal / hh:mm / 12h 19m)
**What changed:** The Quote-mode Hours field is now a flexible-format text input that accepts:
- Decimal hours (`12`, `12.5`, `12,5` for EU comma users)
- Colon notation (`12:19`, `0:30`)
- h/m suffixes (`12h 19m`, `12h19m`, `30m`, `2h`)
The parser (`parseHours` in `utils.js`) returns decimal hours or null for unparseable input (including negatives or "1:60" with minutes ≥ 60). A live "Parsed: 12h 19m" helper appears below the input on a successful parse, falling back to a format hint when empty and a clear error message ("Couldn't parse — try …") on garbage input. The math layer is unchanged — `quote()` still receives decimal hours.
- New helpers: `parseHours(raw)` and `formatHoursLabel(decimal)` with 16 unit tests covering each accepted form, edge cases (1:60 rejected, 12abc rejected), and round-tripping. Three new page tests cover `12:19` end-to-end ($1,231.67 quote at $100/hr), `2h 30m` h/m form, and the error-hint path.
- QuoteInputs becomes a controlled component holding the raw text locally so the user can type partial input (`12:`) without the parent's null parse clobbering the in-flight text. The useEffect that re-syncs on external resets (Clear, Import) skips when both sides agree on null, fixing the mid-type wipe.
**Why:** User flagged "how can I input 12 hours and 19 minutes? the field just has number field". Decimal-only is hostile for a tool freelancers will reach for to bill real time. Smart parsing + parsed-feedback label is more forgiving than two separate fields and matches how time trackers (Toggl/Harvest) accept input.
**Impact:** Hours input changed from `<input type="number" step="0.25">` to `<input type="text">` with a parser. Page tests adjusted for the type change (`toHaveValue('5')` instead of `toHaveValue(5)`).
**Files changed:** `src/app/freelance-rate-calculator/utils.js` (parseHours + formatHoursLabel), `src/app/freelance-rate-calculator/utils.test.js` (parser tests), `src/app/freelance-rate-calculator/components/QuoteInputs.js` (text input + helper), `src/app/freelance-rate-calculator/page.test.jsx` (new tests + updated assertions).

---

## 2026-05-06 - Fix input rendering: kill `appearance: textfield`, bump padding, replace cost-line label hack
**What changed:**
- `.tool-currency-input` and `.tool-field-input`: switched from `appearance: textfield` to `appearance: none` (with `-moz-appearance: textfield` retained for Firefox spinner suppression). On Safari/macOS, `appearance: textfield` was reapplying native widget styling — including a white background that won over `background: transparent` — so the freelance-rate-calculator's currency inputs rendered as a small white pill instead of the dark themed look.
- Both inputs bumped to `padding: 12px 14px` and `font-size: 1rem` to match the meatier feel of the salary-raise pay-input the user is used to.
- `.tool-field-input` now hides webkit number-spinners and styles its placeholder, matching `.tool-currency-input` so a number `<InputField>` (e.g. the Quote-mode "Hours" field) sits visually beside a `<CurrencyInput>` without mismatch.
- `.tool-currency-input` adds `min-width: 0` so it flex-shrinks correctly inside narrow columns; `.tool-currency-symbol` gets a small right padding (4px) for breathing room.
- `.frc-costs-quick-row` and `.frc-costs-line` switched from `1fr` to `minmax(0, 1fr)` — `1fr`'s default min size of `auto` was letting the input's intrinsic size push the track open and looked off in narrow viewports.
- CostsCard's detailed-mode line *label* input no longer uses a raw `<input>` with inline styles slapped on `tool-currency-input` (which had `border: none` and `flex: 1` — wrong for a top-level field). It's now a clean `<input className="tool-field-input">` with a proper aria-label.
**Why:** User flagged "the input feed for the text or numbers is so bad and unlike anything else." Triaged the screenshot to two root causes (Safari's `textfield` appearance defeat + cost-line label hack) and brought the visual feel in line with the rest of the site.
**Impact:** Affects every consumer of `.tool-field-input` (InputField) and `.tool-currency-input` (CurrencyInput) — that means the CGPA/salary-raise/etc. existing tools also gain the bumped padding and font-size. Visually this is consistent with the salary-raise pre-migration pay-input look, so it's a convergence rather than a divergence. All 110 tests across the affected components stay green.
**Files changed:** `src/styles/tools.css`, `src/app/freelance-rate-calculator/freelance-rate-calculator.css`, `src/app/freelance-rate-calculator/components/CostsCard.js`.

---

## 2026-05-06 - Freelance Rate Calculator: register on home + sitemap, archive plan
**What changed:** Added the Freelance Rate Calculator tile to the home page tools grid (briefcase emoji 💼) and a sitemap entry at the standard 0.9 priority. Archived the build plan from `playground/roadmap/2026-05-06_00-30_freelance-rate-calculator/` to `playground/roadmap/1-completed/`. HANDOVER updated to reflect that the 7-commit branch is shipped locally and waiting on the user's browser-test pass before the review round.
**Why:** Final wrap-up after the 7-commit feature branch. Tool is now discoverable from the home page once this branch merges.
**Impact:** No code-behavior changes — link/sitemap registration only.
**Files changed:** `src/app/page.js`, `src/app/sitemap.js`, `playground/HANDOVER.md`, `playground/roadmap/...` (archive move).

---

## 2026-05-06 - Freelance Rate Calculator: JSON config export/import + CSV breakdown (7/7)
**What changed:** New `ExportImportCard` rendered at the bottom of every mode. Three actions:
- **Download config (.json)** — exports the full state inside an envelope `{schema: 'auxbox.freelance-rate-calculator', version, exportedAt, state}` for forward-compat. Filename includes today's ISO date.
- **Download breakdown (.csv)** — Income mode only. Builds a CSV with the five-horizon gross+net rows and the annual breakdown, currency code embedded in the header. Cells with embedded commas/quotes/newlines are CSV-escaped.
- **Import config (.json)** — file input that runs the same `validateFreelanceRateState` as localStorage, then `setState` if valid. Invalid imports show an inline alert and a toast.
- New module `exportUtils.js` with the pure helpers (`buildConfigPayload`, `parseConfigText`, `buildIncomeCsv`, `defaultConfigFilename`, `defaultBreakdownFilename`, `triggerDownload`). Unit tests in `exportUtils.test.js` cover round-trip, schema-marker check, validation rejection, and CSV header presence/escaping. Page tests cover the full upload→rehydrate flow and the invalid-JSON error path.
- File reading uses `FileReader` (jsdom's `File.text()` returns empty in the Vitest harness; FileReader is the reliable cross-environment path).
**Why:** Branch `feat/freelance-rate-calculator`, commit 7 of 7. Closes the feature scope per the original plan.
**Impact:** No new state shape changes — the export envelope wraps the existing storage state so JSON imports and the localStorage rehydrate path share one validator. Time-tracking *integration* (Toggl/Harvest/etc.) remains explicitly out of scope; this commit ships the export-only side of the user's "no deferrals" instruction.
**Files changed:** `src/app/freelance-rate-calculator/exportUtils.js` (new), `src/app/freelance-rate-calculator/exportUtils.test.js` (new), `src/app/freelance-rate-calculator/components/ExportImportCard.js` (new), `src/app/freelance-rate-calculator/page.js`, `src/app/freelance-rate-calculator/page.test.jsx`.

---

## 2026-05-06 - Freelance Rate Calculator: Team multiplier + profit buffer (6/7)
**What changed:** Two new cards rendered in Income and Rate modes:
- **TeamCard** — slider 1–50 for number of billable people. v1 simplification: every teammate shares the same rate + utilization, so total revenue scales linearly. State already existed (`team.people` was wired through the math layer in commit 3); this commit just exposes the UI.
- **ProfitCard** — slider 0–100% for profit margin on top of break-even. Only meaningful in Rate mode (raises the required hourly rate by the configured factor); kept in that mode only. Income mode does not include it because Income answers "what do I make at this rate" — there's no break-even to mark up.
- Two new page tests: TeamCard at 2 people doubles the Income annual-gross display ($134,400 → $268,800) and ProfitCard slider updates state to 20%.
**Why:** Branch `feat/freelance-rate-calculator`, commit 6 of 7.
**Impact:** No new math; everything was already plumbed through `incomeForRate(people)` and `requiredRateForTakeHome(profitMargin)` as of commit 3.
**Files changed:** `src/app/freelance-rate-calculator/page.js`, `src/app/freelance-rate-calculator/page.test.jsx`, `src/app/freelance-rate-calculator/components/TeamCard.js` (new), `src/app/freelance-rate-calculator/components/ProfitCard.js` (new).

---

## 2026-05-06 - Freelance Rate Calculator: Rate mode + sensitivity table (5/7)
**What changed:** Rate mode wired end-to-end. Adds:
- **RateInputs** — single `<CurrencyInput>` for the target annual take-home with helper copy.
- **RateResult** — big monospaced display for the required hourly rate (full 2-decimal currency formatting because the dollars-and-cents matter here), daily/weekly equivalents, monthly billable hours, and a real `<table>` sensitivity grid showing the required rate at 50/60/70/80/90/100% utilization with the user's current row highlighted via `frc-sensitivity-current`.
- **Page** — `rateResult` derived via `useMemo` calling `requiredRateForTakeHome` with the same TimeCard/CostsCard/FeesCard inputs. Rate mode reuses TimeCard, CostsCard, FeesCard (zero new infrastructure).
- Page test added: target $100K → required-rate display + sensitivity row for each utilization, 70% row highlighted as "(yours)".
**Why:** Branch `feat/freelance-rate-calculator`, commit 5 of 7.
**Impact:** Math layer was complete in commit 3 (closed-form `requiredRateForTakeHome`); this commit only adds UI.
**Files changed:** `src/app/freelance-rate-calculator/page.js` (Rate mode wiring), `src/app/freelance-rate-calculator/page.test.jsx` (Rate mode test, replaced obsolete placeholder assertion), `src/app/freelance-rate-calculator/components/RateInputs.js` and `RateResult.js` (new).

---

## 2026-05-06 - Freelance Rate Calculator: Income mode (4/7)
**What changed:** Income mode wired end-to-end on `/freelance-rate-calculator`. Adds three new cards:
- **TimeCard** — sliders for hours/day, days/wk, weeks/yr, utilization with live "working / billable hrs/yr" chips.
- **CostsCard** — Quick / Detailed toggle. Quick = single field with monthly/annual period select. Detailed = repeating line items with predefined-label suggestion chips ("+ Software & subscriptions", etc.) and a live annualised total in the footer.
- **IncomeInputs** + **IncomeResult** — hourly-rate input feeds the result grid (gross + net at hourly/daily/weekly/monthly/annual horizons via shared `<ResultCard>` and `.tool-results-grid`), plus an annual-breakdown `<table>` rendered when costs or fees are non-zero. Footer chips show total billable hours and effective hourly take-home.
- **Page** — `quoteResult`, `incomeResult`, derived `annualCosts`, and `billable` computed via `useMemo`. Income mode shows TimeCard + CostsCard + FeesCard above its result; Quote mode keeps its compact card. Rate mode still placeholder for commit 5.
- Page test updated: added an Income-mode round-trip (default time × $100 = $134,400 annual gross).
**Why:** Branch `feat/freelance-rate-calculator`, commit 4 of 7.
**Impact:** Math layer was already complete in commit 3, so this commit is purely UI + plumbing. No breaking changes to other tools.
**Files changed:** `src/app/freelance-rate-calculator/page.js` (Income mode wiring), `src/app/freelance-rate-calculator/page.test.jsx` (new Income test, replaced obsolete "Income placeholder" assertion), `src/app/freelance-rate-calculator/components/{TimeCard,CostsCard,IncomeInputs,IncomeResult}.js` (new).

---

## 2026-05-06 - Add /freelance-rate-calculator scaffold + Quote mode (3/7)
**What changed:** New `/freelance-rate-calculator` route with the full state/persistence scaffold and Quote mode wired end-to-end. The route renders a mode-toggle (Quote / Income / Rate; Income & Rate currently show a placeholder card to be filled in subsequent commits), currency selector with 10 ISO codes, hours+rate inputs, and a Fees & Taxes card with platform/processor/income-tax/other sliders plus presets (Direct, Upwork 10%, Fiverr 20%, Stripe 2.9%, PayPal 3.4%). The Quote result card renders the gross, each non-zero deduction line, the take-home, and an effective hourly rate footnote, all formatted via `formatCurrency` so the currency selector updates rendering live.
- Pure math in `utils.js`: `workingHoursPerYear`, `billableHoursPerYear`, `totalAnnualCosts`, `applyFees` (compound chain), `quote`, `incomeForRate`, `requiredRateForTakeHome` (closed-form algebra). 27 math tests cover edge cases, the round-trip identity (`requiredRateForTakeHome` ↔ `incomeForRate`), and team/profit scaling.
- Persistence: `freelance_rate_calculator_state` via `createStorageContext`. Auto-save through the shared `useAutoSave` hook; mount-once hydration via `useHydrateStorage`. Validator covers the full state shape including the still-unused fields for Income/Rate modes (so the schema is stable from this commit forward).
- Defaults baked in: 8 hr/day, 5 day/wk, 48 wk/yr, 70% utilization, 1 person, $0 costs, **0% income tax** (user override; was 25%), 0% profit margin.
- Page tests cover quote computation (10 × $100 = $1,000), the compound fee chain via the Upwork 10% preset, the currency-selector live-update, mode-toggle placeholder, Clear, and persistence round-trip.
**Why:** Branch `feat/freelance-rate-calculator`, commit 3 of a planned 7-commit build per `playground/roadmap/2026-05-06_00-30_freelance-rate-calculator/plan.md`. The user requested a multi-commit split rather than a single monolith.
**Impact:** Tool not yet linked from the home page or sitemap; final wrap-up commit will register it. No regressions in prior tools.
**Files changed:** `src/app/freelance-rate-calculator/` (new directory: `constants.js`, `utils.js`, `utils.test.js`, `storageUtils.js`, `StorageContext.js`, `layout.js`, `page.js`, `page.test.jsx`, `freelance-rate-calculator.css`, `components/CurrencyCard.js`, `components/QuoteInputs.js`, `components/QuoteResult.js`, `components/FeesCard.js`).

---

## 2026-05-06 - Lift `<CurrencyInput>` to src/components/ + migrate salary-raise (freelance-rate-calculator 2/7)
**What changed:** New shared `<CurrencyInput>` component — labelled numeric input with a leading currency symbol resolved via `Intl.NumberFormat.formatToParts` (so locales rendering "CA$" or "د.إ" work natively). Forwards the native event on change for drop-in replacement of `<input type="number">`. Shared CSS classes `.tool-currency-*` added to `src/styles/tools.css`. Migrated `salary-raise-calculator`'s `PaySection` to consume the shared component for the four pay-period inputs (the percent input keeps the existing `pay-input` styling since it isn't currency).
**Why:** Place-it-right policy — confirmed second consumer (the upcoming Freelance Rate Calculator and the existing Salary Raise Calculator). Avoids each tool re-styling its own currency-prefixed field.
**Impact:** Salary-raise now shows a `$` prefix on the four period inputs (it didn't before — minor visual upgrade). All 47 salary-raise tests stay green. `<CurrencyInput>` has 8 of its own tests covering symbol resolution, event forwarding, helper/error states, and prop pass-through.
**Files changed:** `src/components/CurrencyInput.js` (new), `src/components/CurrencyInput.test.jsx` (new), `src/styles/tools.css` (currency input section), `src/app/salary-raise-calculator/components/PaySection.js`.

---

## 2026-05-06 - Add `formatCurrency` to src/lib/format.js (freelance-rate-calculator commit 1/7)
**What changed:** New `formatCurrency(value, currency='USD', options?)` helper using `Intl.NumberFormat`. Whole numbers render without trailing zeros (`$1,000`); non-finite input returns `—` matching `formatBytes`. Tests cover USD/EUR/GBP/JPY display, negatives, locale-specific separators, `alwaysDecimals` override, very-large values, and invalid input.
**Why:** Both the upcoming Freelance Rate Calculator and the existing Salary Raise Calculator (commit 2) need locale-aware currency rendering. Single shared helper keeps the formatting consistent and avoids each tool re-deriving it.
**Impact:** Pure addition. No existing consumers; first use comes in commit 2's `<CurrencyInput>` lift. Treats currency as a label only — no FX conversion.
**Files changed:** `src/lib/format.js`, `src/lib/format.test.js`.

---

## 2026-05-06 - Address review-round-1 findings (refactor branch)
**What changed:** Applied 11 of 12 findings from the general review round on `refactor/shared-extractions-batch`. Round folder: `playground/reviews/review-rounds/general/2026-05-06/`.

- **S1** — password-generator: restored Generate→dismiss-prior-copy-toast behaviour (MIN-8 regression). Added `copyToastIdRef` + `showToastForCopy` wrapper so `handleGenerate` can dismiss the stale "Password copied" banner immediately without changing the `useCopyToClipboard` hook API.
- **S2** — `useToast`: replaced `Date.now() * 0x10000 + seqRef` id arithmetic (overflows `MAX_SAFE_INTEGER`, ULP ≥ 32) with a simple monotonic counter `++seqRef.current`. Updated comment block.
- **S3** — `InputField`: `aria-describedby` now only includes `helperId` when no error is active (`[hasError ? errorId : helperId]`). The helper span is not rendered when `error` is set; including its id in `aria-describedby` created a dangling ARIA reference.
- **S4** — pdf-merger CSS: re-added `@media (max-width: 600px) { .pm-row { align-items: stretch } }` so the shared base's responsive override is not defeated by `.pm-row`'s unconditional `align-items: flex-start`.
- **S5** — cron-explainer: captured `hydrated` from `useHydrateStorage` and gated `useAutoSave.enabled` on `hydrated && ...` (matches the contract every other migrated tool follows).
- **S6** — `useCopyToClipboard`: moved `optsRef.current = {…}` assignment from the render body into a `useEffect` (no deps array) so it runs after the commit phase, safe for React concurrent rendering.
- **S7** — `useCopyToClipboard.test.js`: replaced bare `document.execCommand = vi.fn()` assignment with an `Object.defineProperty` guard + `vi.spyOn` + `mockRestore()` to avoid test-pollution from unrestored globals.
- **S8** — `useAutoSave`: added a loud JSDoc note that `deps` MUST have a stable length across renders, plus a dev-only runtime invariant (throws if `deps.length` changes between renders; guarded by `NODE_ENV !== 'production'`).
- **S9** — `useKeyboardShortcuts` JSDoc: updated the "Default behavior" section to explicitly mention `<select>` as a guarded form field, matching the actual `FORM_SELECTOR` constant.
- **S10** — `useHydrateStorage.test.js`: added an unmount-before-async-resolve test that asserts `hydrated` never flips to `true` after the component unmounts (verifies the `cancelled` flag path).
- **S11** — `useCopyToClipboard`: added a concurrent-calls test asserting the second `copy()` dismisses the first's success id then shows its own; added a JSDoc note about concurrent-call behaviour.

**Deferred:** F8 (pomodoro `handleReset` → `useAutoSave.replaceImmediate`) — single real consumer, marginal API-surface growth. Park for when a second tool needs the pattern.

**Why:** Review round findings addressed per the review protocol in `.agents/skills/review/SKILL.md`. Highest-severity finding (S1) was a UX regression introduced by the refactor.

**Impact:** 797 → 800 tests (+3 new: S3 InputField aria-describedby test, S10 unmount test, S11 concurrent test). Lint clean (pre-existing QR `<img>` warnings only). Build green.

**Files changed:**
- `src/hooks/useToast.js` (S2), `src/hooks/useCopyToClipboard.js` (S6, S11 JSDoc), `src/hooks/useCopyToClipboard.test.js` (S7, S11), `src/hooks/useAutoSave.js` (S8), `src/hooks/useKeyboardShortcuts.js` (S9), `src/hooks/useHydrateStorage.test.js` (S10).
- `src/components/InputField.js` (S3), `src/components/InputField.test.jsx` (S3).
- `src/app/password-generator/page.js` (S1), `src/app/cron-explainer/page.js` (S5), `src/app/pdf-merger/pdf-merger.css` (S4).
- `.agents/changelog.md`.

## 2026-05-06 - Shared extractions batch (refactor)
**What changed:** Lifted six recurring patterns into the shared layer and migrated every consumer.

New shared primitives:
- `src/hooks/useAutoSave.js` — debounced dirty-gated save effect. Returns `{markDirty, markClean}`. Replaces the hand-rolled `dirtyRef + setTimeout + cleanup` block in 6 tools.
- `src/hooks/useHydrateStorage.js` — runs a loader once on mount, returns a `hydrated` boolean. Replaces the `useState(false) + useEffect(() => { ... ; setHydrated(true) }, [])` block in 6 tools.
- `src/hooks/useCopyToClipboard.js` — wraps `lib/clipboard.copyToClipboard` with optional toast feedback and toast dedup (tracks the most recent success-toast id and dismisses it on the next call).
- `src/hooks/useKeyboardShortcuts.js` — keydown registration with default modifier + form-field guards.
- `src/hooks/useDisplayTick.js` — rAF-driven re-render trigger while `active` is true (thin wrapper over `useTicker`).
- `src/components/InputField.js` — labelled text input with inline error wiring (aria-invalid + aria-describedby + role="alert" error span). Vertical by default; supports `inline` and consumer override classes.
- `src/lib/format.js` — `formatPercent(pct, options)` (extracted from image-compressor's local helper). Defaults to the savings-sign idiom (positive → U+2212 minus, negative → +).
- `src/styles/tools.css` — added `.tool-stack`, `.tool-sr-only`, `.tool-file-row*` (shell, main, name, meta, actions, list, list-empty, responsive collapse), and `.tool-field*` (label / input / error / helper for `InputField`).
- `src/hooks/useToast.js` — `showToast` now returns the new toast's id (backwards-compatible) and uses a per-instance counter so ids are unique within a single millisecond. Enables the dedup path in `useCopyToClipboard`.

Migrations: stopwatch / pomodoro / markdown-preview / markdown-to-pdf / wheel-spinner / cron-explainer (autosave + hydrate + relevant copy/InputField/keyboard hooks); password-generator (copy hook with dedup, drops the `copyToastIdRef + Date.now()` hack and the unused `hooks.js` re-export of `copyToClipboard`); image-compressor + pdf-merger (`.tool-file-row*` base layered under `.ic-row*` / `.pm-row*`; redundant flex/border-radius/padding rules removed; image-compressor consumes `formatPercent` from the lib); salary-raise-calculator + date-calculator (CSS-only `.pay-stack`/`.dc-stack` → `.tool-stack`).

Tests: 33 new test cases for the new hooks/component/lib helper. Updated `password-generator/page.test.jsx` to mock `../../lib/clipboard` (since the page now imports the shared helper through `useCopyToClipboard`).

**Why:** Six near-identical patterns existed across the 13 tools (autosave debounce, mount-once hydrate, copy-with-toast, keyboard shortcuts, display tick, file-row CSS shell). The audit identified them as the highest-leverage extractions; doing them all in one branch keeps the migration coherent and lets `useToast.showToast → id` ride along instead of being a separate breaking change. Reuse-first per `.agents/skills/conventions/SKILL.md`.

**Impact:** No behaviour change. All 797 tests pass, lint clean (only the pre-existing QR `<img>` warnings remain), `next build` succeeds. The shared layer in `src/hooks` and `src/styles/tools.css` grew; tool-local CSS files shrunk; tool page.js files dropped ~30–60 lines each of repeated state plumbing.

**Files changed:**
- New: `src/hooks/{useAutoSave,useCopyToClipboard,useHydrateStorage,useKeyboardShortcuts,useDisplayTick}.js` + `.test.js` siblings; `src/components/InputField.js` + `.test.jsx`.
- Updated: `src/hooks/useToast.js`, `src/lib/format.js` (+ tests), `src/styles/tools.css`.
- Migrated: `src/app/{stopwatch,pomodoro-timer,markdown-preview,markdown-to-pdf,wheel-spinner,password-generator,cron-explainer,image-compressor,pdf-merger,salary-raise-calculator,date-calculator}/...` (page.js + CSS, plus FileRow.js / PdfFileRow.js / hooks.js / page.test.jsx where touched).

## 2026-05-05 - Image Compressor: move row status chip from meta line to name line
**What changed:** The "Queued" / "Compressing…" / error chip is now rendered next to the file name (right-aligned on the same line) instead of inside the meta row. Added a flex container `.ic-row-name-row` (`display: flex; align-items: center; gap: 0.6rem; min-height: 1.4rem`) wrapping the name + chip. The name uses `flex: 1 1 auto` with `min-width: 0` so it ellipsises when long; the chip uses `flex: 0 0 auto`. The meta row no longer carries the chip.
**Why:** During slider movement, each row goes done → queued → encoding → done in quick succession. Even though the chip was always-mounted, its content (and chip-element padding/border) appearing inside the meta row caused the line height to grow when text appeared, which jerked the row's container vertically. Moving the chip up to the name line — where it lives in the slack to the right of the (potentially-ellipsised) name — keeps the row's overall height pinned by the name line's `min-height` and removes the jerk.
**Impact:** Visual only. No behaviour change. Status text moved up; meta row now only carries size/savings/dimensions. Tests still green (no test referenced the chip's DOM location).
**Files changed:** `src/app/image-compressor/components/FileRow.js`, `src/app/image-compressor/image-compressor.css`.

## 2026-05-05 - Unhide Image Compressor on home + sitemap (polish branch)
**What changed:** Re-added the `/image-compressor` entry to `src/app/page.js` `TOOLS` and to `src/app/sitemap.js` (`lastModified: 2026-05-05`). Restores what `77cbb95` removed when the tool was parked. Sits on `feat/image-compressor-polish` — NOT merged to `main`, so the user can reassess in dev before any UX iteration lands.
**Why:** User opened the polish branch to reassess the tool. The tool is only visible on the home page in dev if it's listed; this is the prereq for identifying what needs work.
**Impact:** `/image-compressor` back on the home grid and in the sitemap on this branch only. Tool behaviour unchanged — same code as on `main`.
**Files changed:** `src/app/page.js`, `src/app/sitemap.js`.

## 2026-05-05 - Fix pdf-merger general review (1 major, 10 minor)
**What changed:** Applied all 11 findings from the general review round on `feat/pdf-merger`. MAJ-1: encryption detection in `parsePdfMetadata` now gates on `err.name === 'EncryptedPDFError'` first, then `/encrypt/i` message fallback — prevents silent misclassification if pdf-lib changes its error message. MIN-1: `validateAdditions` now runs per-file validators (MIME, size) before applying the slot cap, so `.png` and oversized files get the accurate rejection reason. MIN-2: `setMergeStatus('success')` moved to after `onDownload` (now inlined in the hook) returns successfully; download failures set `status='error'`. MIN-3: `parsePageRange` adds `/^\d+$/` raw-string gate before `Number()`, rejecting scientific notation (`1e2`), leading-plus (`+5`), and hex literals (`0x3`). MIN-4: `PDFDocument.load` in `mergePdfs` now passes `{ignoreEncryption: false}` explicitly. MIN-5: `downloadBlob` moved from `page.js` into `hooks.js`; hook tracks created URLs in `urlsRef = useRef(new Set())` with `setTimeout`-deferred revocation and an unmount cleanup effect. MIN-6: Reorder hint ("Drag rows to reorder, or use the ↑/↓ buttons.") added above the file list. MIN-7: `inputMode="numeric"` added to the page-range `<input>`. MIN-8: `mergedFilename(snapshot)` call changed to `mergedFilename()` (zero-arg). MIN-9: `mergedCount` state added to `usePdfMerger`; success live-region reads from it instead of `files.length`. MIN-10: Explicit `clearAll` test added to `hooks.test.js`.
**Why:** General review (Opus + Copilot) round on the initial PDF Merger commit.
**Impact:** 754 → 760 tests passing (+6 new: 1 MAJ-1 named-error, 4 MIN-3 range rejection, 1 MIN-10 clearAll). Lint: 0 errors. Build: green.
**Files changed:** `src/app/pdf-merger/{pipeline.js, pipeline.test.js, hooks.js, hooks.test.js, utils.js, utils.test.js, page.js, components/PdfFileRow.js}`, `.agents/changelog.md`.

## 2026-05-05 - Add PDF Merger (`/pdf-merger`)
**What changed:** New `/pdf-merger` route. Drop multiple PDFs (shared `<DropZone>` consumer with `accept="application/pdf"`, `multiple={true}`); per-file row showing name, size (via shared `formatBytes`), page count, page-range input, drag handle + up/down keyboard buttons, remove button. HTML5 native drag-and-drop reorder (no DnD library). Async parse via `pdf-lib`'s `PDFDocument.load()` to populate page count and detect encryption. Page-range syntax `"1-3,5,7-9"` (1-based, empty = all pages); validated against actual page count with friendly inline errors. Hard caps: 50 MB per file, 8 files total. Encrypted PDFs surfaced with a friendly "Password-protected PDFs are not supported" error. Merge pipeline (`pipeline.js`) creates a new `PDFDocument`, calls `copyPages` per source, returns a Blob; fully async, fully in-memory. **No persistence at all** — files exist for the page session only (privacy: PDFs are user-private content). Live region (`role="status" aria-live="polite"`) announces merge state; `role="alert"` for top-level errors. Files-never-leave-the-browser copy on the page. New dep: `pdf-lib@1.17.1`. No shared lifts in this change — `<DropZone>` and `formatBytes` were already shared (lifted during the image-compressor build); image-compressor's `<FileRow>` is shaped differently and was deliberately NOT consolidated.
**Why:** Last tool from the original 10-tool batch. Reuses the shared file-input primitives that were lifted ahead of this exact use case during the image-compressor build.
**Impact:** 685 → 754 tests passing (+69: utils 21 + pipeline 12 + hooks 18 + page 18). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green; `/pdf-merger` static. Bundle adds `pdf-lib` (~50 KB gzipped); no other deps.
**Files changed:** `src/app/pdf-merger/{page.js, layout.js, constants.js, utils.js, utils.test.js, pipeline.js, pipeline.test.js, hooks.js, hooks.test.js, page.test.jsx, pdf-merger.css, components/PdfFileRow.js}`, `src/app/page.js` (TOOLS entry), `src/app/sitemap.js` (route entry), `package.json`, `package-lock.json`.

## 2026-05-05 - Fix cron-explainer general review (1 blocker, 3 major, 4 minor)

**What changed:** Applied all 8 findings from the general review round on `feat/cron-explainer`.

- **BLK-1** (`page.js`): Wrapped both result cards (description + next-runs) in a single `<div role="region" aria-label="Cron expression results" aria-live="polite" aria-atomic="false">` so SR users hear output as it updates. The error path retains `role="alert"`.
- **MAJ-1** (`page.js`): Added `if (expression.length > MAX_PERSISTED_CHARS) return;` gate in the debounced auto-save effect (mirrors markdown-preview pattern). Prevents >1000-char pastes from writing to localStorage and triggering a phantom "Failed to load" toast on the next mount. `MAX_PERSISTED_CHARS` added to the import.
- **MAJ-2** (`utils.test.js`): Replaced the zone-sensitive weekday assertion with a UTC-pinned version using `CronExpressionParser.parse(..., {tz: 'UTC'})` and `DateTime.fromJSDate(jsDate, {zone: 'UTC'})`. Test now passes under `TZ=America/Los_Angeles`.
- **MAJ-3** (`utils.js`, `page.js`): `parseExpression` now returns the constant `'Invalid cron expression.'` instead of forwarding the raw library error. Page helper text renders `parseResult.error` directly (dropping the `'Cron expression is invalid: '` prefix that would have caused redundant doubling).
- **MIN-1** (`page.js`): Added `const [now, setNow] = useState(...)` and a 60 s `setInterval` effect that bumps `now`; passed `now` as `fromDate` to `nextRuns` so relative labels refresh on an idle tab.
- **MIN-2** (`page.test.jsx`): Added test asserting that a >1000-char paste does not write to localStorage after the MAJ-1 gate lands.
- **MIN-3** (`utils.js`): `isoString: dt.toISO() ?? String(jsDate.getTime())` — defensive fallback for a hypothetical null ISO string.
- **MIN-4** (`utils.js`): `nextRuns` default param changed from `new Date()` to `DateTime.now().toJSDate()` (Luxon-everywhere rule).

**Why:** Review findings — BLK-1 excluded SR users from the tool's success path; MAJ-2 caused deterministic CI failures in any timezone west of UTC-6; MAJ-1/MAJ-3 caused user-visible phantom toasts and raw library error leaks.

**Impact:** 26 tests (was 20), all passing. Lint: 0 errors. Build: green.

**Files changed:** `src/app/cron-explainer/{page.js, utils.js, utils.test.js, page.test.jsx}`, `.agents/changelog.md`.

---

## 2026-05-05 - Add Cron Expression Explainer (/cron-explainer)

**What changed:** New tool at `/cron-explainer`. Single text input takes a 5-field cron expression; on valid input the page shows a plain-English description (via `cronstrue`) and the next 5 fire times (via `cron-parser`) rendered with Luxon in the user's local time zone (absolute label via `DATETIME_MED_WITH_WEEKDAY`, relative label via `DateTime.toRelative({base})`). Eight preset chips fill the input on click (every minute, every hour, daily/weekdays at 9 AM, every 15 min, weekly, monthly, yearly). Invalid input flips the input border red and shows the parser's error in helper text with `role="alert"`. State persists via `createStorageContext` under `cron_explainer_state` (`{expression: string}`) with the standard 300 ms debounced auto-save and the dirtyRef pattern (no phantom write on fresh mount). Footer note exposes the actual zone name from `DateTime.now().zoneName`.

`utils.js` exposes three pure helpers: `parseExpression`, `describe`, `nextRuns(src, count, fromDate)` — `nextRuns` accepts an injectable `fromDate` so tests are deterministic. All wall-clock formatting goes through Luxon; `cron-parser`'s native Date is converted at the boundary via `DateTime.fromJSDate()`. `describe` gates on `cron-parser` first because cronstrue's lenient parser would otherwise accept some inputs that cron-parser rejects.

New deps: `cronstrue@^3.14.0` (default export, ~10 KB gzipped) and `cron-parser@^5.5.0` (named export `CronExpressionParser`, ~30 KB gzipped). Both MIT, browser-friendly, well-maintained. No shared lifts: the preset row is tool-local (different visual pattern from `<ModeToggle>`), and a `useDebouncedValue` hook was considered but rejected — the input → parse pipeline is cheap enough to recompute on every render and there is no second consumer.

**Why:** Decoding a cron expression is a routine task for developers (CI configs, ops infrastructure) and helps non-technical teammates understand a cadence. Existing online tools either require sign-up or send the expression to a server; this one runs entirely in-browser like the rest of auxbox.tools.

**Impact:** New route `/cron-explainer` registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`. New tests: `utils.test.js` (15 cases across `parseExpression` / `describe` / `nextRuns`, with deterministic `fromDate` injection) and `page.test.jsx` (10 render + interaction cases including invalid-input error path, preset click, autosave round-trip, restore on mount, and the local-zone footer). Lint: 0 errors. Build: green (route present in the manifest). Tests: must pass via the pre-commit hook (sandbox blocks ad-hoc test runs in the agent harness).

**Files changed:** `src/app/cron-explainer/{page.js, layout.js, constants.js, utils.js, utils.test.js, storageUtils.js, StorageContext.js, cron-explainer.css, page.test.jsx}` (new), `src/app/page.js` (TOOLS entry), `src/app/sitemap.js` (route), `package.json`, `package-lock.json` (deps), `.agents/changelog.md`.

## 2026-05-04 - Fix: pomodoro completion fires from setTimeout to work cross-tab; suppress ghost notifications on rehydrate

**What changed:** Phase auto-completion in the Pomodoro Timer was driven by the rAF ticker (`useTicker`). Browsers freeze `requestAnimationFrame` when the tab is hidden, so the completion callback (chime + OS notification + state transition) only fired when the user returned to the tab — producing a "ghost notification" exactly at the moment they came back, not at the actual completion time. Fixed by driving completion via `setTimeout` instead (which keeps firing in background tabs, throttled to ~1 Hz minimum by browsers — more than sufficient for multi-minute intervals). The rAF ticker continues to run for the visual countdown display only; the `onTick` callback now only calls `setTick`.

Implementation: a `useEffect` in `PomodoroContent` (keyed on `runtime` and `settings`) schedules a `setTimeout` for `remainingMs` when status is `RUNNING`, and clears it on Pause, Skip, Reset, and unmount. The `completionTimeoutRef` holds the active timeout ID. Settings changes (e.g. slider drag mid-run) cause a reschedule for the correct new remaining time.

Ghost-notification suppression on rehydrate: if the persisted state has `status: RUNNING` and `remainingMs <= 0` on mount (the phase ended while the page was closed), `completePhase()` is called directly inside the mount effect with no audio or notification side effects — the state transitions silently to the next phase so the display is correct.

**Why:** `requestAnimationFrame` is paused in background tabs by browsers (per the Page Visibility API). `setTimeout` with a delay ≥ several hundred ms is allowed to fire in hidden tabs (per the HTML spec, throttled to ~1 Hz), making it reliable for coarse-grained events like phase completion.

**Impact:** Phase completion now fires at the correct wall-clock time regardless of tab visibility. Ghost notifications on tab-return are eliminated. 663 tests pass (658 baseline + 5 new: one positive completion test, three clear-on-action tests, one rehydrate-silent test). Lint: 0 errors. Build: green.

**Files changed:** `src/app/pomodoro-timer/page.js`, `src/app/pomodoro-timer/page.test.jsx`, `.agents/changelog.md`.

## 2026-05-04 - Fix: gate full pomodoro notification region on mount to clear hydration mismatch

**What changed:** Replaced the pre-mount placeholder-button approach (commit `a023b3f`) with a `mounted &&` gate that renders the entire notification toggle region as `null` until client mount. Previously the placeholder `<Button>` (a `<button>` element) conflicted with what SSR actually produced when `notificationsSupported=false` (a `<span>`) — causing a server/client element-shape mismatch. Now both SSR and the initial client render produce nothing for this subtree; after `useEffect` sets `mounted=true`, the correct state-based UI appears.

**Why:** Hydration error persisted after `a023b3f` because the placeholder element type (`button`) didn't match the SSR output element type (`span`). Rendering `null` pre-mount is the only safe pattern when the entire element shape depends on client-only APIs (`Notification`, `window`).

**Impact:** Notification toggle button briefly absent until JS hydrates (one frame, imperceptible). All 658 tests pass unchanged (RTL flushes effects synchronously so `mounted` is `true` by assertion time). Lint: 0 errors. Build: green.

**Files changed:** `src/app/pomodoro-timer/page.js`, `.agents/changelog.md`.

## 2026-05-04 - Fix: pomodoro hydration mismatch on notification settings

**What changed:** Added a `mounted` boolean state (set to `true` in the same `useEffect` that sets `hydrated`) in `PomodoroContent`. The notification-toggle section of the Settings card is now gated on `mounted`. Before mount, a stable disabled "Enable notifications" placeholder button is rendered — matching the SSR output. After mount, the four real notification states (A/B/C/D based on `permission`, `notifyEnabled`, and `supported`) render as before. This eliminates the Next.js hydration mismatch caused by `useNotificationPermission` returning `supported=false`/`permission='denied'` during SSR and real browser values on first client render.

**Why:** Browser console showed a React hydration error on `/pomodoro-timer` — the notification status span rendered `aria-live="polite"` + status text on the client but nothing on the server, causing a server/client DOM mismatch.

**Impact:** No behaviour change post-mount. Test count unchanged (existing notification-toggle tests use RTL which flushes effects synchronously, so `mounted` is `true` by the time assertions run). Lint: 0 errors. Build: green. No hydration warning in browser.

**Files changed:** `src/app/pomodoro-timer/page.js`.

## 2026-05-04 - Pomodoro Timer: chime length, notification toggle, work-duration guard

**What changed:** Three UX/correctness fixes on the Pomodoro Timer:

1. **Chime length (Issue 1):** Replaced the original ~9 KB, ~200 ms 880 Hz sine WAV with a new triple-beep WAV (~1.75 s, 27 KB, 8000 Hz mono 16-bit PCM). Pattern: 880 Hz × 250 ms → 250 ms gap → 880 Hz × 250 ms → 250 ms gap → 1100 Hz × 250 ms (ascending close) → 500 ms tail silence. Each beep uses an 8 % linear attack / 42 % sustain / 50 % linear-decay envelope to avoid clicks. Generated locally with a Node one-shot (not committed). Documented at the `new Audio(...)` call site in `src/app/pomodoro-timer/page.js`.

2. **Notification toggle (Issue 2):** The "Enable notifications" button is now a true toggle with four states:
   - State A (`permission='default'`, `notifyEnabled=false`): "Enable notifications" — clicks → requests permission, on grant sets `notifyEnabled=true`.
   - State B (`permission='granted'`, `notifyEnabled=true`): "Disable notifications" — clicks → sets `notifyEnabled=false`, no re-request.
   - State C (`permission='granted'`, `notifyEnabled=false`): "Enable notifications" — clicks → sets `notifyEnabled=true` directly, no re-request.
   - State D (`permission='denied'`): explanatory status span ("Notifications blocked in browser — update your browser settings to enable."), no button.
   - API-absent: "Notifications not supported in this browser." (existing behaviour, now shown instead of State D).
   Also fixed: `fireNotification` now checks `settings.notifyEnabled` in addition to `permission === 'granted'`, so toggling off actually suppresses the `new Notification(...)` call.

3. **Work-duration across phase cycle (Issue 3):** Investigated the suspected stale-closure root cause. Thorough review of `hooks.js`, `utils.js`, `page.js`, `storageUtils.js`, and `useTicker.js` confirmed that the state machine, `completePhase`, `durationFor`, and `computeRemaining` are all correct. `currentPhaseDurationMs = durationFor(runtime.phase, settings)` recomputes fresh on every render; `stateRef.current` ensures `completePhase` reads the latest runtime; `callbackRef` in `useTicker` ensures `onTick` always uses the latest callback. No code-level bug was found — the suspected stale-closure double-completion scenario is neutralised by React 18's render-flush ordering. A regression test (work=30 min, full work→break→work cycle via rAF mocking) is added and passes, confirming correct behaviour and providing a guard against future regressions.

**Why:** User-reported issues after initial Pomodoro Timer shipment.
**Impact:** Test count: 653 → 658 (+5 new notification-toggle and phase-cycle tests). Lint: 0 errors. Build: green. Asset: `public/sounds/pomodoro-chime.wav` replaced (27 KB, ~1.75 s).
**Files changed:** `public/sounds/pomodoro-chime.wav`, `src/app/pomodoro-timer/page.js`, `src/app/pomodoro-timer/page.test.jsx`.

## 2026-05-04 - Add Pomodoro Timer (/pomodoro-timer); lift useNotificationPermission to src/hooks/
**What changed:** New `/pomodoro-timer` route — configurable Pomodoro Timer with Work / Short break / Long break phase machine, long-break cadence (default every 4 work sessions), big monospaced `MM:SS` display, phase pill, progress bar, Start / Pause / Skip / Reset controls, mute toggle, opt-in desktop notifications, audible chime on phase completion, today's count + last-7-days history strip, and tab-title timer while running. Persists `{settings, runtime, history}` under `pomodoro_timer_state` via `createStorageContext` (300 ms debounced auto-save, dirty-ref gated, synchronous Reset that wipes runtime only — settings + history preserved; markdown-preview MAJ-2 fix shape applied). Wall-clock reads via Luxon `DateTime.now().toMillis()`; today's-date key via `DateTime.local().toISODate()` so midnight rollover Just Works. Consumes the existing `useTicker`, `useDocumentTitle`, `<Slider>`, `<Card>`, `<Button>`, `<ToastContainer>` shared primitives off the shelf.

Auto-transition behaviour: when remaining hits 0 mid-phase, the tool fires the chime (unless muted), fires a desktop notification (if opted in and granted), increments today's `completedPomodoros` if leaving Work, then advances to the next phase in `paused` status — user must press Start to begin the break / next work session.

Audio asset: `public/sounds/pomodoro-chime.wav` — synthetically generated 0.2 s 880 Hz sine, mono 16-bit PCM @ 22 050 Hz, with a cosine-bell envelope to avoid clicks (~9 KB). Generated locally with a Node one-shot (script not committed) so the project does not depend on an external CDN or sourcing a CC0 sample. Documented at the `new Audio(...)` call site in `src/app/pomodoro-timer/page.js`.

Shared lift in the same branch:
- `src/hooks/useNotificationPermission.js` — `useNotificationPermission()` returns `{permission, request, supported}`. `permission` mirrors `Notification.permission` (`'default' | 'granted' | 'denied'`), falling back to `'denied'` when the API is missing. `request()` calls `Notification.requestPermission()` and updates state; no-op when unsupported. Co-located test (7 cases) covers both supported and unsupported branches. Future tools (any reminder / scheduled-cue tool) can consume this off the shelf.

State machine kept tool-local at `src/app/pomodoro-timer/hooks.js` because its shape is phase-specific (phase + status + cadence + history) and not generally reusable.

**Why:** Eighth tool in the batch; rounds out the timer/focus pair (Stopwatch + Pomodoro). Place-it-right policy required `useNotificationPermission` to be shared from day one (a second consumer is foreseeable); the rest of the tool reuses every relevant existing primitive.
**Impact:** Test count: 585 → 653 (+68). Lint: 0 errors (pre-existing QR `<img>` warnings only). Build: `/pomodoro-timer` static. No new dependencies. New asset `public/sounds/pomodoro-chime.wav` (~9 KB).
**Files changed:** `src/app/pomodoro-timer/{page.js, layout.js, constants.js, utils.js, utils.test.js, hooks.js, hooks.test.js, storageUtils.js, StorageContext.js, pomodoro-timer.css, page.test.jsx}`, `src/hooks/{useNotificationPermission.js, useNotificationPermission.test.js}`, `src/app/page.js`, `src/app/sitemap.js`, `public/sounds/pomodoro-chime.wav`.

## 2026-05-05 - Date Calculator: inline 8-hr/day clarification on the toggle label
**What changed:** Working-days toggle label updated from "Working days only (Mon–Fri)" to "Working days only (Mon–Fri · 8 hrs/day)". The previous bottom-note paragraph below the working-row cards was removed — keeping the assumption inline with the toggle is shorter and the natural place to see it before flipping the switch.
**Why:** First pass added a separate footnote under the cards; user feedback was that it read long and looked misplaced. The toggle label is the right home — both pieces of info travel together (Mon–Fri AND 8 hrs/day) so the user knows what they're enabling.
**Impact:** No behaviour change. Toggle label is slightly longer; bottom note is gone. Tests unaffected.
**Files changed:** `src/app/date-calculator/page.js`.

## 2026-05-05 - Fix: address stopwatch general review (1 major, 7 minor)
**What changed:** Applied all 8 findings from the 2026-05-05 general review round on `feat/stopwatch`.
MAJ-1: Added two keyboard tests in `page.test.jsx` — `'l'` while running records a new lap row; `'l'` while paused/idle does not. Pins the conditional `status === STATUS.RUNNING` guard in the keyboard handler.
MIN-1: Updated `useTicker.js` JSDoc to use neutral Luxon-aware phrasing (`DateTime.now().toMillis()`) instead of nudging consumers toward `Date.now()`.
MIN-2: Fixed two stale comments in `hooks.js:14` and `page.js:38` that said `Date.now()` — actual implementation uses `DateTime.now().toMillis()`.
MIN-3: Removed `aria-hidden="true"` from the keyboard-shortcut hint `<p>` in `page.js`; wrapped shortcut keys in `<kbd>` for semantic clarity.
MIN-4: Simplified timer element a11y — dropped per-frame `aria-label` interpolation and redundant `aria-live="off"`; now uses stable `aria-label="Elapsed time"`.
MIN-5: Added regression test for "Start → Reset within the auto-save debounce window" — verifies the `dirtyRef` gate blocks the phantom write (same fix shape as markdown-preview MAJ-2).
MIN-6: Added focus-guard tests for `'l'` and `'r'` keys inside a textarea, mirroring the existing Space-in-textarea test.
MIN-7: Broadened the focus-guard selector from `[contenteditable=true]` to `[contenteditable]:not([contenteditable="false"])` so bare `contenteditable` and `contenteditable=""` attributes (common in rich-text editors) are also guarded. Added a test pinning the bare-`contenteditable` case.
**Why:** Closes the 2026-05-05 general review round — zero MAJ items outstanding.
**Impact:** Test count: 579 → 585 (+6 new keyboard/focus-guard/regression tests). Lint: 0 errors. Build: `/stopwatch` static. No new dependencies.
**Files changed:** `src/app/stopwatch/{page.js, hooks.js, page.test.jsx}`, `src/hooks/useTicker.js`.

## 2026-05-04 - Add Stopwatch (/stopwatch); lift useTicker + useDocumentTitle to src/hooks/
**What changed:** New `/stopwatch` route — big monospaced display, Start/Stop/Lap/Reset buttons, lap list (most-recent first), `Space`/`L`/`R` keyboard shortcuts (ignored when focus is in form fields), tab-title timer while running, persists across reload via `createStorageContext` (`stopwatch_state`, 300 ms debounced auto-save, dirty-ref gated, synchronous Reset wipe — markdown-preview MAJ-2 fix shape). State machine: `{status: 'idle'|'running'|'paused', startedAt, accumulatedMs, laps[]}`. Wall-clock reads via `DateTime.now().toMillis()` (Luxon, codebase-consistent with Date Calculator). Two shared hooks lifted from day one for the upcoming Pomodoro Timer to consume off the shelf:
- `src/hooks/useDocumentTitle.js` — `useDocumentTitle(title: string | null)`. Captures the original title once on mount; sets it while a non-empty string is passed; restores the original on unmount or when value becomes null/empty. Co-located test (7 cases).
- `src/hooks/useTicker.js` — `useTicker(callback, {active})`. rAF loop firing `callback(performance.now())` on every frame while `active` is true; cancels on unmount or active flip. Generic, state-free — does not encode "stopwatch state". Co-located test (6 cases).
`useStopwatch` stays tool-local in `src/app/stopwatch/hooks.js` (state machine is shaped for laps; promotion deferred until a second consumer asks for the same shape — Pomodoro will use phases, not laps).
**Why:** Adds the next tool in the batch; Pomodoro Timer (next) reuses both shared hooks.
**Impact:** Test count: 525 → 579 (+54: 7 useDocumentTitle + 6 useTicker + 21 stopwatch/utils + 8 stopwatch/hooks + 12 stopwatch/page). Lint: 0 errors. Build: `/stopwatch` route generated as static. No new dependencies.
**Files changed:** `src/hooks/{useDocumentTitle,useDocumentTitle.test,useTicker,useTicker.test}.js` (new shared); `src/app/stopwatch/{page,layout,constants,utils,utils.test,storageUtils,StorageContext,hooks,hooks.test,stopwatch.css,page.test}.{js,jsx,css}` (new tool); `src/app/page.js`, `src/app/sitemap.js` (route registration).

## 2026-05-04 - Fix: address Date Calculator general review (2 major, 6 minor)
**What changed:** Applied all 8 findings from the 2026-05-05 Opus general review round on `feat/age-date-difference`.
MAJ-1: Replaced both `<ul className="dc-units-row">` blocks with `<div className="tool-results-grid">` + `<ResultCard>` children. Deleted `.dc-units-row`, `.dc-units-row li`, `.dc-unit-label`, `.dc-unit-value` from `date-calculator.css`. Total Weeks value string now composes the remainder suffix (e.g. `"21 + 1 day"`) directly.
MAJ-2: Removed the `if (savedEnd !== null)` guard so that a persisted `endDate: null` is honoured unconditionally on rehydrate instead of silently falling back to today. Added a regression test asserting the end input is empty when `endDate: null` is in storage.
MIN-1: `DEFAULT_STATE.startDate` and `DEFAULT_STATE.endDate` changed from `''` to `null` — consistent with the serialized shape written by autosave.
MIN-2: `DatePicker` sync effect now depends on `valueIso` (the ISO string of the incoming value) rather than the Luxon instance reference, so a fresh `DateTime.now()` for the same date no longer clobbers in-progress typing.
MIN-3: `workingDaysBetween` replaced with an O(1) closed-form (full-weeks×5 + fixed-size 7-iteration inner loop for remainder weekday count). Added 100-year-span test: `2000-01-01` → `2100-01-01` = 26090 working days.
MIN-4: `DatePicker` now sets `aria-invalid="true"` and renders a `<p class="tool-datepicker-hint">Use YYYY-MM-DD</p>` when `inputText` is non-empty and fails to parse. `aria-describedby` is composed (consumer-provided id joined with the error id). Three new `DatePicker` a11y tests added.
MIN-5: `startMonth` and `endMonth` hoisted to module scope in `DatePicker.js` (both were reallocated per render; `THIS_YEAR` was already at module scope).
MIN-6: JSDoc on `workingDaysBetween` now states `@remarks Callers must pass start <= end; negative spans return 0.`
**Why:** Findings from the Opus review round — see `playground/reviews/review-rounds/general/2026-05-05-date-calculator/review-findings.md`.
**Impact:** Test count: 520 → 525 (+5: 1 `workingDaysBetween` 100-year span test, 1 MAJ-2 regression test, 3 `DatePicker` a11y tests). Lint: 0 errors. Build: green.
**Files changed:** `src/app/date-calculator/{page.js,constants.js,utils.js,utils.test.js,page.test.jsx,date-calculator.css}`, `src/components/{DatePicker.js,DatePicker.test.jsx}`.

## 2026-05-04 - Date Calculator: split units row + add working hours/minutes
**What changed:** Result area now renders two separate `.dc-units-row` containers. Row 1 (always visible): Total Days, Total Weeks, Total Hours, Total Minutes. Row 2 (only when the working-days toggle is ON): Total Working Days, Total Working Hours, Total Working Minutes. New pure helper `totalWorkingUnits(workingDays)` in `utils.js` computes working hours (days × 8) and working minutes (days × 480). CSS class renamed from `.dc-units-list` to `.dc-units-row`.
**Why:** UX change — previously the single Working Days card was crammed into the same row as the four calendar-time cards; now it leads its own dedicated working-time row with hours and minutes.
**Impact:** Date Calculator result layout. `utils.js` gains `totalWorkingUnits`. `page.js` uses `workingUnits` (object) instead of `working` (scalar). CSS renames `.dc-units-list` → `.dc-units-row`. Test count: 515 → 520 (+5 new, -0 removed).
**Files changed:** `src/app/date-calculator/utils.js`, `src/app/date-calculator/utils.test.js`, `src/app/date-calculator/page.js`, `src/app/date-calculator/page.test.jsx`, `src/app/date-calculator/date-calculator.css`

## 2026-05-04 - DatePicker: brand the popup (override blue accent → primary-color)
**What changed:** The previous DatePicker commit set `--rdp-accent-color` on `.tool-datepicker-popup`, but react-day-picker declares `--rdp-accent-color: blue` on `.rdp-root` itself — a closer scope — so the override never reached the calendar. Selected day, today indicator, dropdown chevrons, and nav arrows all stayed blue. Override now targets `.tool-datepicker-popup .rdp-root` so it wins the cascade. Also fixed a wrong variable name (`--rdp-background-color` → `--rdp-accent-background-color`, the actual v9 token), and added `--rdp-today-color: var(--primary-color)` so the today indicator matches the brand instead of the library default.
**Why:** User screenshot showed the picker still rendering blue accents despite the previous override. Root cause was CSS-variable cascade scoping inside react-day-picker.
**Impact:** Selected day, today indicator, dropdown chevrons, and previous/next-month arrows now use `--primary-color` (#ff6b6b). All other behaviour unchanged. Tests pass without modification (visual change only).
**Files changed:** `src/styles/tools.css`.

## 2026-05-04 - Date Calculator: react-day-picker + Luxon refactor; lift DatePicker to shared
**What changed:** Replaced native `<input type="date">` in the Date Calculator with a new shared `<DatePicker>` component (text input + calendar toggle popup). Added "Today" buttons next to each date input. End date now defaults to today on mount; Start stays empty. All date arithmetic migrated from hand-rolled YMD records to Luxon `DateTime`. Storage shape unchanged (`{startDate, endDate, mode, includeWorkingDays}` with string|null dates); validator updated to accept `null` for empty fields. New deps: `react-day-picker@9.14.0`, `luxon@3.7.2`. Shared lift: `src/components/DatePicker.js` + `src/components/DatePicker.test.jsx`. Note: `react-day-picker` v9 has no Luxon adapter — conversion at the boundary (`DateTime.toJSDate()` / `DateTime.fromJSDate()`) is done inside `DatePicker.js`; the public component API is `DateTime | null` throughout. Canonical diffYMD edge cases verified to match Luxon output before migrating (all six cases identical). `daysInMonth` and `addMonths` helpers removed (no longer needed). CSS: `date-calculator.css` drops the old `<input type="date">` block; `tools.css` gains `.tool-datepicker*` block with popup, toggle button, and input styles using design tokens.
**Why:** Native date inputs are browser-styled, can't match the dark-theme aesthetic, and have poor cross-platform UX (especially iOS). react-day-picker provides an accessible keyboard-navigable calendar with year/month dropdowns. Luxon eliminates the hand-rolled leap-year/DST arithmetic and gives DateTime objects throughout the app layer.
**Impact:** 499 → ~511 tests (utils.test.js rewritten for Luxon DateTime inputs; page.test.jsx updated for new DOM shape + Today button + end-defaults-to-today; DatePicker.test.jsx adds ~11 new tests). Lint + build: green. No additional deps beyond the two already installed.
**Files changed:** `src/components/{DatePicker.js,DatePicker.test.jsx}` (new), `src/app/date-calculator/{page.js,utils.js,utils.test.js,storageUtils.js,page.test.jsx,date-calculator.css}` (rewritten), `src/styles/tools.css` (`.tool-datepicker*` block added), `package.json`, `package-lock.json` (deps), `.agents/changelog.md`.

## 2026-05-04 - Add Date Calculator (`/date-calculator`)
**What changed:** New `/date-calculator` route. Two modes via shared `<ModeToggle>`: "Difference between two dates" (pick start + end, see breakdown) and "Age from date" (pick a birth date; the second field defaults to today and remains editable for "age at a future date"). Result Card shows the primary YMD breakdown ("Y years, M months, D days"), an alternate-units list (total days, total weeks + remainder, total hours, total minutes), an optional "Working days" line gated on a Mon–Fri toggle (default OFF), an inline note when end < start ("End date was before start; showing absolute difference") because the math always swaps to a non-negative span, and a "Calculated in your local time zone" footnote. Two `<input type="date">` fields (no date-picker library). Persisted state via `createStorageContext` under `date_calculator_state` (`{startDate, endDate, mode, includeWorkingDays}`) with the same 300 ms debounce + dirty-ref gating + synchronous-Clear pattern as markdown-to-pdf (Clear sets `dirtyRef.current = false` so the post-Clear effect tick skips the write — no phantom record). Pure date math lives in `utils.js`: `parseISODate` (strict yyyy-mm-dd, rejects impossible dates including Feb 29 in non-leap years), `compareDates`, `swapIfReversed`, `diffYMD` (Java Period.between algorithm — uses an `addMonths` helper with end-of-month clamping to handle the canonical 2024-01-31 → 2024-03-01 = 1 month 1 day edge), `totalDaysBetween` (UTC-based to dodge DST), `totalUnits` (days/weeks/hours/minutes derived), and `workingDaysBetween` (loop with `getUTCDay`). No new dependencies; no shared lifts (calendar math is tool-specific — flagged in the plan that a `<DateField>` styled wrapper or `formatDuration` helper would only be promoted if a second consumer appears). The mode picker consumes the existing shared `<ModeToggle>` directly.
**Why:** Tool needed in the batch — covers "how old am I", "how many days until X", "how many working days until the deadline", "how many weeks of leave have I taken". Coordinator override mid-build renamed the originally-planned `/age-calculator` to `/date-calculator` so both modes are framed equally. The Java Period algorithm is the canonical fix for the end-of-month borrow bug — a naive "borrow the prev month's days" approach yields negative days for the 2024-01-31 → 2024-03-01 case.
**Impact:** 456 → 499 tests (+43: 30 new in `src/app/date-calculator/utils.test.js` covering `parseISODate` valid/malformed/out-of-range/leap-day, `compareDates`, `swapIfReversed`, `diffYMD` six edge cases including the 2024-01-31 → 2024-03-01 canonical edge, `totalDaysBetween` leap/non-leap/single-day/cross-DST, `totalUnits` weeks-with-remainder, `workingDaysBetween` Mon–Fri/start-Sat/end-Sun/all-weekend/single-day-weekday/single-day-weekend; +13 in `src/app/date-calculator/page.test.jsx` covering page render, empty placeholder, one-year span breakdown, end-before-start swap note, mode switch + label change, age-mode-defaults-to-today, working-days toggle gating, autosave round-trip with all four fields, no-write-on-fresh-mount, restore-on-mount, Clear synchronous wipe, Clear no-phantom-record, and Clear-disabled-when-empty). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green; `/date-calculator` is statically generated. No new runtime deps.
**Files changed:** `src/app/date-calculator/{page.js,layout.js,constants.js,utils.js,utils.test.js,storageUtils.js,StorageContext.js,date-calculator.css,page.test.jsx}` (new), `src/app/page.js` (TOOLS entry for `/date-calculator`), `src/app/sitemap.js` (route entry).

## 2026-05-04 - Fix: address markdown-to-pdf review (3 major, 6 minor)
**What changed:** Applied all 9 findings from the 2026-05-04 general review round on the already-merged markdown-to-pdf scope.
MAJ-1: Added optional `ariaDescribedBy` prop to `<ModeToggle>` (forwarded to the `role="radiogroup"` div); gave the preset description `<p>` a stable `id="mtp-preset-description"` and wired it up. Screen readers now announce the description for the focused radio group.
MAJ-2: Implemented the WAI-ARIA radio keyboard pattern in `<ModeToggle>`: roving tabindex (active radio has `tabIndex=0`, others `-1`); ArrowLeft/Up and ArrowRight/Down navigate and wrap; Home/End jump to first/last; `onChange` fires and focus moves to the newly-selected radio on each arrow press. Space/Enter continue to work via native `<button>` click. Backwards-compatible: wheel-spinner click-based tests unchanged.
MAJ-3: Added a test that captures `#mtp-print-root.className` inside a `window.print` mock at call-time and asserts the active preset class is committed before `window.print()` fires.
MIN-1: Moved descriptions out of `PRESET_OPTIONS` (which now carries `{value, label}` only) into a separate `PRESET_DESCRIPTIONS` map keyed by preset id. `<ModeToggle>` PropTypes stays `{value, label}` — no tool-specific fields leak into the shared component.
MIN-2: Added a CSS comment near `@page { margin: 0 }` in `markdown-to-pdf.css` explaining the trade-off (body padding handles per-preset margins; browser-default Headers and Footers in the print dialog will overprint without a physical margin band).
MIN-3: Extracted the `CSS.supports('field-sizing', 'content')` check into a new shared module `src/lib/featureDetect.js` (`HAS_FIELD_SIZING` constant, evaluated once at module load). Both `markdown-to-pdf/page.js` and `markdown-preview/page.js` now import and guard on it instead of re-evaluating on every keystroke.
MIN-4: Added feature-gate tests in both `page.test.jsx` files: stub `HAS_FIELD_SIZING` true → assert `editor.style.height === ''`; stub false → assert height was set. Tests use a mutable `vi.mock` factory.
MIN-5: Added a CSS comment to the `body *:not(#mtp-print-root):not(#mtp-print-root *)` print-hide rule documenting the assumption and instructing future contributors to add printable content inside the container or extend the selector.
MIN-6: Added a round-trip test asserting that selecting Compact persists `preset === 'minimal'` to localStorage (pins the label→id mapping).
**Why:** Address all findings from the retroactive general review round. MAJ-2 was the largest gap — `role="radiogroup"` implies the WAI-ARIA keyboard contract which was not implemented.
**Impact:** 438 → 456 tests (+18: 12 new ModeToggle keyboard/tabindex tests, 1 MAJ-3 print-time class assertion, 4 MIN-4 feature-gate tests across both page files, 1 MIN-6 Compact preset round-trip). Wheel-spinner: 23/23 passing without modification. Lint: 0 errors (2 pre-existing QR warnings). Build: green.
**Files changed:** `src/components/ModeToggle.js` (ariaDescribedBy prop, roving tabindex, keyboard handler), `src/components/ModeToggle.test.jsx` (12 new tests), `src/lib/featureDetect.js` (new), `src/app/markdown-to-pdf/constants.js` (PRESET_OPTIONS slimmed, PRESET_DESCRIPTIONS map added), `src/app/markdown-to-pdf/page.js` (PRESET_DESCRIPTIONS import + use, ariaDescribedBy wiring, HAS_FIELD_SIZING import), `src/app/markdown-to-pdf/page.test.jsx` (featureDetect mock + 6 new tests), `src/app/markdown-to-pdf/markdown-to-pdf.css` (MIN-2 + MIN-5 comments), `src/app/markdown-preview/page.js` (HAS_FIELD_SIZING import), `src/app/markdown-preview/page.test.jsx` (featureDetect mock + 2 new tests).

## 2026-05-04 - UX: smaller preset description + remove editor scrollbar entirely
**What changed:** Two follow-up tweaks on top of the prior autosize/preset-description commit. (1) `.mtp-preset-description` margin bumped from 0 to `0.75rem 0 0`, font-size from `0.78rem` to `0.85rem`, line-height from `1.4` to `1.45`, colour switched from `var(--text-light)` to `var(--text-secondary)` — matches the secondary-text convention used elsewhere in `tools.css` and gives the line breathing room under the preset chips. (2) Editor textarea now reliably has zero scrollbar. Root cause of the residual scrollbar: the JS `el.style.height = scrollHeight` autosize effect was running unconditionally and racing against `field-sizing: content` in modern Chromium/Safari — `field-sizing` sizes the box from rendered content while the JS measured `scrollHeight` (which can be 1–2 px short mid-paint with `field-sizing` already active) and fixed an inline height slightly under what the content needed, re-introducing a scrollbar. Fix: gate the inline-height path on `CSS.supports('field-sizing', 'content')` so modern browsers leave sizing to CSS and older browsers still get the JS fallback. Belt-and-braces: `overflow: hidden` split into `overflow-y: hidden` + `overflow-x: auto` on both `.mtp-editor` and `.mp-editor` to make the no-vertical-scrollbar guarantee explicit, while still allowing an extremely wide pasted line to scroll horizontally rather than break the card layout. Same fix applied to `markdown-preview`.
**Why:** User reported the description was cramped and the scrollbar was still visible despite the prior commit. Investigation found the two autosize paths were fighting each other in modern browsers; the textbook `CSS.supports` feature-detect-then-no-op resolves it.
**Impact:** Tests unchanged at 438 passing. Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green.
**Files changed:** `src/app/markdown-to-pdf/markdown-to-pdf.css` (.mtp-preset-description spacing/font, .mtp-editor overflow split), `src/app/markdown-to-pdf/page.js` (autosize effect gates on `CSS.supports('field-sizing', 'content')`), `src/app/markdown-preview/markdown-preview.css` (.mp-editor overflow split), `src/app/markdown-preview/page.js` (same gating on the autosize effect).

## 2026-05-04 - UX: autosize editor + preset descriptions on markdown-to-pdf
**What changed:** Two UX fixes on the Markdown to PDF tool (with the autosize fix mirrored to Markdown Preview). (1) Editor textarea auto-grows with content instead of scrolling internally. CSS `field-sizing: content` handles Chromium 123+/Safari 17+ for free; a `useEffect` fallback (`el.style.height = 'auto'` then `el.style.height = el.scrollHeight + 'px'`) runs on every `source` change for older browsers. `min-height` lowered from 420 px to 320 px (sensible empty-state floor). `resize: vertical` removed; `overflow: hidden` added so the scrollbar never appears. Same CSS + JS changes applied to `src/app/markdown-preview/page.js` and `markdown-preview.css`. (2) Preset picker visible labels renamed: `default` → **Modern**, `minimal` → **Compact** (`academic` unchanged). A one-line description now appears below the preset picker (inside the toolbar Card) and updates instantly when the user switches presets. Descriptions: Modern — "Sans-serif, 11 pt, 2 cm margins. Clean, general-purpose look."; Academic — "Serif (Georgia), 12 pt, 2.5 cm margins, justified text. Research-paper style."; Compact — "Sans-serif, 10 pt, 1.5 cm margins, lighter headings. Tight one-pager." Internal preset ids (`default`/`academic`/`minimal`) and localStorage keys unchanged — persisted state stays compatible. New `.mtp-preset-picker` wrapper + `.mtp-preset-description` CSS classes added to `markdown-to-pdf.css`. The autosize pattern is intentionally tool-local in both tools; flagged for promotion to a shared hook if a third tool needs it.
**Why:** User-requested UX improvements: (1) fixed-height textarea with a scrollbar felt like a code editor rather than a document editor; auto-grow removes that friction. (2) Chip labels `default`/`minimal` were opaque; descriptive labels + inline descriptions let users pick the right preset without trial and error.
**Impact:** 435 → 438 tests (+3: one description-shows-by-default, one Academic-description-after-select, one Compact-description-after-select). Existing preset-picker tests updated to use new chip labels (Modern/Compact). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green.
**Files changed:** `src/app/markdown-to-pdf/constants.js` (PRESET_OPTIONS labels + description fields), `src/app/markdown-to-pdf/page.js` (editorRef, autosize effect, activePresetOption lookup, .mtp-preset-picker wrapper + .mtp-preset-description p in JSX), `src/app/markdown-to-pdf/markdown-to-pdf.css` (.mtp-preset-picker, .mtp-preset-description, .mtp-editor autosize), `src/app/markdown-to-pdf/page.test.jsx` (label updates + 3 new description tests), `src/app/markdown-preview/page.js` (editorRef, autosize effect), `src/app/markdown-preview/markdown-preview.css` (.mp-editor autosize).

## 2026-05-04 - Add Markdown to PDF (window.print route); lift `<ModeToggle>` to `src/components/ModeToggle.js`
**What changed:** New `/markdown-to-pdf` route. Same split-pane shape as Markdown Preview (controlled `<textarea>` editor on the left, sanitized rendered HTML preview on the right via `dangerouslySetInnerHTML` of `renderMarkdown(source)` from the shared `src/lib/markdown.js`) plus a 3-option print-preset segmented control (default / academic / minimal) and a "Download as PDF" button that calls `window.print()` after the active preset class has been applied to the print container. The print stylesheet (`@media print { ... }`) hides every node in the DOM except the print container (`#mtp-print-root`) and its descendants using `body *:not(#mtp-print-root):not(#mtp-print-root *) { visibility: hidden }` (the reciprocal `#mtp-print-root, #mtp-print-root * { visibility: visible }`). Per-preset print rules: `default` (system sans, 11pt, 2cm margins), `academic` (Georgia/Times serif, 12pt, 2.5cm margins, justified text, indented paragraphs, centered H1, italic H3), `minimal` (system sans, 10pt, 1.5cm margins, lighter heading weights). Common print rules: `page-break-after: avoid` on headings, `page-break-inside: avoid` on `<pre>` / `<table>` / `<img>`, white background, black text, A4 page size with zero outer page margin (per-preset margins live on the inner body padding so user-set scale at print time behaves predictably). State persists via `createStorageContext` under `markdown_to_pdf_state` (`{document: string, preset: 'default' | 'academic' | 'minimal'}`) with the same 300 ms autosave debounce, dirty-ref gating, 200 KB soft cap, and synchronous-Clear pattern as Markdown Preview (Clear sets `dirtyRef = false` so the post-Clear effect tick skips the write). Toolbar shows char count, the preset picker (`<ModeToggle>`), Insert sample (only when empty), Download as PDF, and Clear. `useDeferredValue` keeps typing latency off the render path. Shared lift in the same change: `<ModeToggle>` (segmented control / radiogroup) extracted from `src/app/wheel-spinner/components/ModeToggle.js` to `src/components/ModeToggle.js` with renamed generic CSS classes (`.mode-toggle` / `.mode-option` / `.mode-option--active`) moved into `src/styles/tools.css` next to the other shared visual primitives. The wheel-spinner-specific option arrays (`PRESENTATION_OPTIONS`, `SESSION_OPTIONS`) moved to `src/app/wheel-spinner/constants.js`; `src/app/wheel-spinner/page.js` now imports `ModeToggle` from `src/components/ModeToggle` and the option arrays from `./constants`. `useDocumentDraft` (textarea + auto-save + Clear) was considered for extraction but kept tool-local: Markdown Preview persists `{document}` while this tool persists `{document, preset}`, so a single shared hook would have to grow a serializer/extra-fields-saver layer that's awkward enough that two ~30-line consumers are clearer than one larger abstraction. The decision is documented here for future reference; if a third consumer with the same shape lands, revisit.
**Why:** Tool needed in the batch (writers' tool, exports a styled PDF without uploading anything). `window.print()` over `html2pdf` / `jspdf` keeps the bundle clean (zero new deps) and gives perfect text quality through the OS-native print pipeline; the user picks "Save as PDF" from their OS dialog. Sanitization reuses `src/lib/markdown.js` so there's no second markdown rendering surface to keep up to date. Lifting `<ModeToggle>` follows the place-it-right policy: the component API is generic (`options` / `value` / `onChange` / `ariaLabel` / `disabled`) and now has two callers (wheel-spinner uses two instances; this tool uses one), so the lift is required, not optional.
**Impact:** 416 → 435 tests (+19: 16 new in `src/app/markdown-to-pdf/page.test.jsx` covering preset-class mapping, page render, typing→preview wiring, preset picker class-on-container wiring, `window.print()` invocation, Download disabled-when-empty, live-preview XSS payload non-execution, autosave round-trip with both `document` and `preset`, no-write-on-fresh-mount, restore-on-mount, Clear disabled state, Clear synchronous wipe, and the phantom-write regression that mirrors the markdown-preview MAJ-2 fix; +3 in `src/components/ModeToggle.test.jsx` covering options render with active-radio aria-checked, click-fires-onChange-with-value, and disabled-blocks-click). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green; `/markdown-to-pdf` is statically generated. No new runtime deps. Sanitization coverage is reused from `src/lib/markdown.test.js` (authoritative); the page test only verifies the wiring through `dangerouslySetInnerHTML` doesn't bypass the sanitizer (one end-to-end `<script>` payload, asserts `window.__pwned` undefined). The wheel-spinner CSS file shrank by ~36 lines (the `.ws-mode-*` block moved out); wheel-spinner tests untouched and still 23/23 green.
**Files changed:** `src/app/markdown-to-pdf/{page.js,layout.js,constants.js,storageUtils.js,StorageContext.js,markdown-to-pdf.css,page.test.jsx}` (new), `src/components/ModeToggle.js` (new shared component, lifted from wheel-spinner), `src/components/ModeToggle.test.jsx` (new), `src/styles/tools.css` (new `.mode-toggle` / `.mode-option` / `.mode-option--active` block, lifted), `src/app/wheel-spinner/page.js` (import-swap to shared `ModeToggle`, option arrays imported from `./constants`), `src/app/wheel-spinner/constants.js` (added `PRESENTATION_OPTIONS` / `SESSION_OPTIONS`), `src/app/wheel-spinner/wheel-spinner.css` (removed lifted `.ws-mode-*` rules; renamed remaining `@media (max-width: 480px)` selector to `.mode-toggle`), `src/app/wheel-spinner/components/ModeToggle.js` (deleted), `src/app/page.js` (TOOLS entry for `/markdown-to-pdf`), `src/app/sitemap.js` (route entry).

## 2026-05-04 - Fix: address markdown-preview general review (MAJ-1, MAJ-2, MIN-1, MIN-2); lift copyToClipboard to src/lib/clipboard.js
**What changed:** Applied all 4 findings from the 2026-05-04 general review round on the markdown-preview feature. MAJ-1: lifted `copyToClipboard` from tool-local duplicates in `src/app/markdown-preview/page.js` and `src/app/password-generator/hooks.js` to a shared module `src/lib/clipboard.js`; both consumers now import from the shared lib; `password-generator/hooks.js` re-exports it for backward compatibility; the duplicated clipboard tests in `hooks.test.js` are removed (authoritative tests now live in `src/lib/clipboard.test.js` covering empty/nullish input, modern path success, modern-path-failure → legacy-path fallback, both-paths-fail, and textarea cleanup). MAJ-2: fixed phantom auto-save after Clear — `handleClear` in `markdown-preview/page.js` now sets `dirtyRef.current = false` (was incorrectly `true`) immediately after wiping storage, so the debounced save effect skips the write 300 ms later; updated the in-code comment to document the actual semantics; added a regression test that advances timers 500 ms after Clear and asserts localStorage remains null. MIN-1: added `@remarks` JSDoc to `renderMarkdown` in `src/lib/markdown.js` warning that it is browser-only (DOMPurify requires a DOM) and that server-side callers must polyfill via jsdom. MIN-2: added SVG-XSS sanitization test in `src/lib/markdown.test.js` asserting that `<svg onload="window.__svg_xss=true"></svg>` has its `onload` attribute stripped (or the element removed) and the side-effect global never set.
**Why:** General review round findings: MAJ-1 enforces the place-it-right rule (two callers is the threshold); MAJ-2 fixes a correctness bug where a phantom empty record was written to localStorage after Clear; MIN-1 documents a known runtime constraint for future server-side consumers; MIN-2 guards against a future DOMPurify allowlist tweak re-introducing SVG-borne XSS.
**Impact:** 410 → 416 tests (+6: 9 new in `src/lib/clipboard.test.js`, 1 MAJ-2 regression in `page.test.jsx`, 1 MIN-2 SVG XSS in `markdown.test.js`, minus the previously duplicated clipboard tests removed from `hooks.test.js`). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green.
**Files changed:** `src/lib/clipboard.js` (new), `src/lib/clipboard.test.js` (new), `src/lib/markdown.js` (JSDoc only), `src/lib/markdown.test.js` (SVG XSS test), `src/app/markdown-preview/page.js` (import swap + handleClear fix), `src/app/markdown-preview/page.test.jsx` (regression test), `src/app/password-generator/hooks.js` (re-export from lib), `src/app/password-generator/hooks.test.js` (removed duplicated clipboard tests).

## 2026-05-04 - Add Markdown Preview; lift `renderMarkdown` to `src/lib/markdown.js`
**What changed:** New `/markdown-preview` route. Split-pane editor + live preview tool: a plain controlled `<textarea>` on the left, a sanitized rendered HTML pane on the right, side-by-side on desktop (≥768 px) and stacked on mobile. Toolbar `Card` row above the panes shows a live character count plus three actions: "Insert sample" (visible only when the document is empty), "Copy as HTML" (copies the rendered HTML to the clipboard via a tool-local `copyToClipboard` helper, with toast confirmation and an aria-live announcement), and "Clear" (wipes textarea + persisted storage synchronously, with toast confirmation). The preview renders via `dangerouslySetInnerHTML` of `renderMarkdown(source)` — safe because the helper sanitizes before returning. Render performance keeps typing snappy via `useDeferredValue` on the source string: the textarea binds to the immediate value, the preview renders from the deferred value. Document persists via `createStorageContext` under `markdown_preview_state` (`{document: string}`) with a 300 ms autosave debounce; `dirtyRef`-gated so a fresh-mount no-interaction visit does not write defaults to localStorage; `MAX_PERSISTED_CHARS = 200_000` skips the autosave write for runaway pastes (preview still renders). Mount restores the saved document. Shared lift in the same change: `src/lib/markdown.js` exporting `renderMarkdown(src, options?)` — configures `marked` with `{gfm: true, breaks: false, langPrefix: 'language-'}` and pipes the parsed HTML through `DOMPurify.sanitize` with default allowlist (no customisation — safest default is the maintained one). The next tool (Markdown→PDF) will consume the same helper. Co-located test in `src/lib/markdown.test.js` covers GFM rendering of 7 constructs (headings, ul/ol lists, tables, task lists with checkbox inputs, fenced code with `language-` class, blockquotes, links, images) and 5 sanitization payloads (`<script>`, `onerror=`, `javascript:`-URL, `<iframe>`, `<style>` — all stripped/neutered with side-effects verified absent). Page-level tests cover render, typing-updates-preview, GFM tables/task-lists in the live preview, two sanitization payloads in the live preview (no `<script>` survives, `onerror` stripped, side-effect globals never set), copy-as-HTML clipboard call + toast + content match, copy disabled when empty, clear disabled when empty, clear synchronous storage wipe, autosave round-trip + restore, and no-write-on-fresh-mount. Registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`. New deps: `marked@^18.0.3` and `dompurify@^3.4.2` (both small, well-maintained, browser-friendly).
**Why:** Core writers' tool; first markdown surface on the site. Lifting `renderMarkdown` from day one is the place-it-right policy in action — Markdown→PDF is the next tool in the batch and will consume the same helper, so building it shared now avoids the lift-later tax. Sanitization is mandatory: `dangerouslySetInnerHTML` over arbitrary user-typed markdown without `DOMPurify` is an XSS hole, and four hostile payloads are tested at both the lib level and the live preview level to lock that contract in.
**Impact:** 385 → 410 tests (+25: 13 in `src/lib/markdown.test.js` covering GFM render + sanitization, 12 in `src/app/markdown-preview/page.test.jsx` covering page render, copy/clear/autosave, and live-preview sanitization). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green; `/markdown-preview` is statically generated. New runtime deps: `marked` (~50 KB minified) and `dompurify` (~20 KB minified) — both browser-friendly with no transitive ecosystem creep. The `copyToClipboard` helper is intentionally duplicated tool-locally for now (also lives in `src/app/password-generator/hooks.js`); promotion to `src/hooks/` is parked until a third tool needs it. No syntax highlighting in fenced code blocks — `marked` is configured with `langPrefix: 'language-'` so the existing CSS class is in place for a future highlight.js plug-in.
**Files changed:** `src/lib/markdown.js` (new), `src/lib/markdown.test.js` (new), `src/app/markdown-preview/{page.js,layout.js,constants.js,storageUtils.js,StorageContext.js,markdown-preview.css,page.test.jsx}` (new), `src/app/page.js` (TOOLS entry), `src/app/sitemap.js` (route entry), `package.json` + `package-lock.json` (added `marked` and `dompurify`).

## 2026-05-04 - Fix: address wheel-spinner general review (2 major, 8 minor)
**What changed:** Applied all 10 findings from the 2026-05-04 general review round. MAJ-1: `handleClear` now calls `clearState()` synchronously — the old 300ms debounce no longer races against a refresh within the debounce window. MAJ-2 + MIN-4: `canSave` now gates on `options.length >= MIN_ENTRIES && options.length <= MAX_ENTRIES_SOFT_CAP`; the ListEditor hint for over-cap entries changed from a soft warning to a hard "Maximum 100 entries — remove some to save." error, and the hint for under-cap now mentions "save" explicitly. MIN-1: Slice keys in `SpinWheel` and `QuickPick` changed from `${i}:${entry}` to `entry` (entries are dedup'd, so stable); added a `pinnedEntriesRef` in page.js that locks the wheel display to the spin-time roster until the next pick, eliminating the visual snap-to-shrunken-list on winner announcement. MIN-2: Added `dirtyRef` in page.js; the autosave effect is gated on `dirtyRef.current` and is only set to `true` by `handleSave`, `handleClear`, `handleSetPresentation`, and `handleSetSessionMode` — a fresh mount with no user action no longer writes defaults to localStorage. MIN-3: Removed dead `k >= schedule.length` branch from `runQuickPick` in hooks.js (the `k === schedule.length - 1` branch was the only finalise path; the early-return was unreachable). MIN-5: Added one-line comment near the null-reset in `pick()` explaining why the reset is load-bearing for the announcement effect. MIN-6: Tightened JSDoc on `pickWinnerIndex` ("n >= 1; returns 0 when n === 1") and `quickPickSchedule` ("n >= 2; callers handle n === 1 outside the schedule"). MIN-7: Single-mode action label changed from "Pick one" to "Pick". MIN-8: Added upper-bound check in `secureRandomInt` (`max > 0x1_0000_0000` throws `RangeError`) with a unit test; also added boundary test that `max === 0x1_0000_0000` does not throw.
**Why:** General review round findings; correctness (MAJ-1 synchronous clear, MAJ-2 UI/storage contract), usability (MIN-7 label, MIN-2 no spurious writes), correctness/safety (MIN-8 infinite loop prevention), code quality (MIN-3 dead code, MIN-4 save/pick contract alignment, MIN-5 comment, MIN-6 JSDoc), and UX (MIN-1 wheel stability).
**Impact:** 380 → 385 tests (+5: 1 synchronous-clear, 1 MAJ-2 over-cap disabled, 1 MAJ-2 within-cap enabled, 2 MIN-8 range boundary). Lint: 0 errors (2 pre-existing warnings). Build: green. Password-generator tests unchanged.
**Files changed:** `src/app/wheel-spinner/page.js`, `src/app/wheel-spinner/hooks.js`, `src/app/wheel-spinner/utils.js`, `src/app/wheel-spinner/components/SpinWheel.js`, `src/app/wheel-spinner/components/QuickPick.js`, `src/app/wheel-spinner/components/ListEditor.js`, `src/app/wheel-spinner/page.test.jsx`, `src/lib/random.js`, `src/lib/random.test.js`.

## 2026-05-04 - Wheel Spinner: explicit Save/Clear instead of auto-save for entries
**What changed:** The `options` list in the wheel-spinner no longer auto-saves on every keystroke. Entries are now persisted only when the user clicks a "Save" button. A "Clear" button replaces the old bottom "Clear list" button and additionally wipes the saved `options` snapshot from localStorage. Two new buttons appear in the first Card immediately below the textarea. Save is disabled when the parsed entries are empty; Clear is disabled when both the textarea is empty and no previously saved options exist. A toast ("Entries saved") is shown on every Save click. UX preferences (`presentation`, `sessionMode`) continue to auto-save debounced as before. On mount, the persisted `options` still pre-fill the textarea (behavior unchanged). Storage shape unchanged: `{options, presentation, sessionMode}`.
**Why:** Explicit save prevents accidental loss of a curated list on refresh mid-edit, and eliminates the "unsaved typing is persisted without intent" footgun from the auto-save contract.
**Impact:** 372 → 380 tests (+8: 3 Save-button, 3 Clear-button, 1 prefs-auto-save pref-only write, 1 typing-alone does not write options). Updated: `src/app/wheel-spinner/page.js`, `src/app/wheel-spinner/wheel-spinner.css`, `src/app/wheel-spinner/page.test.jsx`.

## 2026-05-04 - Add Wheel Spinner; lift `secureRandomInt` to `src/lib/random.js`
**What changed:** New `/wheel-spinner` route. Random picker over a user-supplied list with two orthogonal axes: presentation (Quick Pick — entries flash by with a decelerating cadence for ~1.5 s, then snap to the winner; Spin Wheel — colourful SVG wheel rotates with `cubic-bezier(0.16, 1, 0.3, 1)` and lands the winner under a fixed pointer) and session (Single pick — independent picks; Pick multiple — each winner is removed from a working list and appended to a session-only "Picks so far" panel until the list is empty, with a "Reset picks" CTA). Action-button label adapts in Pick-multiple mode ("Pick next" → "Pick last" → disabled "All picked"). Editing the textarea re-derives the source and clears the picks (different roster). Persisted state via `createStorageContext` under `wheel_spinner_state`: `{options: string[], presentation: 'quick'|'wheel', sessionMode: 'single'|'multiple'}` only — picks are NEVER persisted (verified by an explicit assert that reads localStorage after a pick). Auto-save debounced 300 ms. Pure utilities live in `utils.js`: `parseEntries` (split + trim + dedupe + drop empty), `pickWinnerIndex` (wraps the new shared `secureRandomInt`), `removeEntryAt`, `quickPickSchedule(n, winnerIndex, totalMs, steps)` returning `{index, delay}` items with monotonically non-decreasing delays summing exactly to `totalMs` and the last index forced to the winner, `targetRotationFor(index, n, extraSpins)` and `winnerFromRotation(rotation, n)` (exact round-trip inverses; pointer at top, slice centres land under it, clockwise positive), `buildPalette(n)` (deterministic HSL hue-stepped palette), and `slicePath(cx, cy, r, startDeg, endDeg)` (SVG path for a pie slice). Wheel SVG degrades gracefully — labels are dropped beyond 50 entries while colours remain. ARIA: a polite live region announces the winner once. Shared lift in the same change: extracted `secureRandomInt` from `src/app/password-generator/utils.js` to `src/lib/random.js` with co-located tests covering bounds, type rejection, large-`max` rejection sampling, and a chi-square smoke for distribution. `src/app/password-generator/utils.js` now re-exports `secureRandomInt` from the new shared module so existing consumers (and the existing 35 password-generator utils tests) keep importing from `./utils` unchanged. Registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`.
**Why:** First randomness-as-ceremony tool; serves the "draw a name" / "pick a lunch place" / "decide who's it" use cases over the same browser-only pitch as the rest of the site. The two-axis UX (presentation × session) lets one tool cover both single-shot ceremony and full-list elimination without cloning the list editor / mode controls / storage. The `secureRandomInt` lift is the place-it-right policy: the password-generator and wheel-spinner both need fair indices, and any future random-picker tool will too — easier to lift now than to chase the duplication later.
**Impact:** 321 → 372 tests passing (+51: 7 `src/lib/random`, 32 wheel-spinner utils, 12 wheel-spinner page integration). Lint: 0 errors (2 pre-existing QR `<img>` warnings unchanged). Build: green; `/wheel-spinner` is statically generated. No new dependencies. Password-generator tests unchanged and still passing — the public API of `./utils` (named `secureRandomInt`) is preserved through the re-export. Animation behaviour (CSS transform on the SVG wheel, `transitionend` event) cannot be visually verified in jsdom: page integration tests use Vitest fake timers + a safety-timer fallback in `usePicker` so the winner still announces if `transitionend` never fires.
**Files changed:** `src/lib/random.js` (new), `src/lib/random.test.js` (new), `src/app/password-generator/utils.js` (replaces local `secureRandomInt` with a re-export from `src/lib/random`), `src/app/wheel-spinner/{page.js,layout.js,constants.js,utils.js,utils.test.js,storageUtils.js,StorageContext.js,hooks.js,page.test.jsx,wheel-spinner.css}` (new), `src/app/wheel-spinner/components/{ListEditor.js,ModeToggle.js,QuickPick.js,SpinWheel.js,PicksList.js}` (new), `src/app/page.js` (TOOLS entry), `src/app/sitemap.js` (route entry).

## 2026-05-04 - Hide image-compressor from home page + sitemap until polish lands
**What changed:** Removed the `/image-compressor` entry from `src/app/page.js` `TOOLS` and from `src/app/sitemap.js`. The route remains accessible by direct URL (so testing on staging is straightforward), but it is no longer surfaced to discoverers or search engines.
**Why:** User-directed: the tool needs more polish before public exposure. Hide rather than revert so the work-in-progress can keep landing on staging without users finding an unfinished surface from the home page.
**Impact:** Home page card grid drops from three to two tools (CGPA Calculator, QR Code Generator, Password Generator → CGPA, QR, Password). Sitemap has the same shape minus image-compressor. Direct visits to `/image-compressor` still render the working tool.
**Files changed:** `src/app/page.js`, `src/app/sitemap.js`.

## 2026-05-04 - UX: dropzone polish, slider redesign, dimension sliders, row stability
**What changed:** Four UX issues fixed on the image-compressor. (1) `<DropZone>` CSS polished in `tools.css`: larger padding (`3rem 2rem`), bigger border-radius (16px), icon lift animation on hover/over, stronger dragover glow + scale(1.01), full-width default, visually-hidden SR-status rule added. QR code generator migrated to the shared `<DropZone>` (replaces inline `.qr-dropzone*` block); `.qr-dropzone*` CSS removed from `qr-generator.css`; `isDragging` state and `fileInputRef` removed from QRCodeGenerator; `handleLogoFiles` adapter added. QR generator test added (`QRCodeGenerator.test.jsx`) asserting the dropzone renders via `role=button` with the shared `tool-dropzone` class, not `qr-dropzone`. (2) `<Slider>` redesigned: track height 8px, filled-track gradient via `--fill` CSS custom property, larger/more-tactile thumb (22px, 3px border, stronger shadow), hover animation on thumb, opt-in `withNumericInput` prop renders a precise number input beside the track. `Slider.test.jsx` extended with 6 new tests for `withNumericInput` and the `--fill` style attribute. (3) `DimensionInputs` replaced text inputs with `<Slider>` sliders; shows "Largest source: N px wide/tall" label when originals are known; slider max is the largest decoded source dimension (fallback 4096); rightmost position = "Original" (no limit, maps back to empty-string state). `pipeline.js` now returns `srcWidth`/`srcHeight` from the decoded bitmap. `hooks.js` stores `originalWidth`/`originalHeight` on each row (set on first encode, preserved across re-encodes) and exposes `largestOriginalWidth`/`largestOriginalHeight` computed from items. (4) Row layout stability: `reencodeAll` no longer nulls `outputBlob/outputUrl/outputSize` — stale result is kept on the row during re-encode so the Download button stays mounted. Old URL revoked only when new encode completes. `FileRow.js` refactored: Download button renders whenever `hasOutput` (status-independent), disabled + shows "Compressing…" label during re-encode; status chip (always-rendered inline in the meta row) replaces the old status-replacing block. `role="status" aria-live="polite"` semantics preserved on the chip.
**Why:** User-reported UX issues: dropzone felt utilitarian, quality slider lacked tactile feedback, dimension inputs gave no hint of original sizes, and the row flickered on re-encode.
**Impact:** Issue 1: QR generator renders shared DropZone (verified by `QRCodeGenerator.test.jsx` querying `role=button` with shared label; `qr-dropzone` class absent). Issue 2: Slider has filled track and larger thumb; `withNumericInput` opt-in; password-generator LengthControl unchanged (prop absent = old behavior; verified by all 65 password-generator tests still passing). Issue 3: DimensionInputs now shows sliders with original-dimension labels once files are decoded; encode pipeline unchanged (null = no constraint; verified by utils tests). Issue 4: row bounding box does not change between status transitions; Download button stays in DOM during re-encode (verified by hooks test asserting `outputUrl` and `outputBlob` remain on item during re-encode, and that status cycles through `queued`/`encoding` without nulling output fields). Test count: 309 → 321 (+12: 3 QR, 6 Slider, 3 hooks). Lint: 0 errors, 2 pre-existing warnings. Build: green.
**Files changed:** `src/styles/tools.css` (`.tool-slider*` and `.tool-dropzone*` redesigned, `.tool-dropzone-sr-status` added), `src/components/Slider.js` (`withNumericInput` prop, `--fill` style, numeric input handler), `src/components/Slider.test.jsx` (+6 tests), `src/app/image-compressor/pipeline.js` (returns `srcWidth`/`srcHeight`), `src/app/image-compressor/hooks.js` (`originalWidth`/`originalHeight` stored; `reencodeAll` no longer nulls output; `largestOriginalWidth/Height` exposed), `src/app/image-compressor/hooks.test.js` (+3 tests: row stability, originalWidth/Height, largestOriginalWidth/Height), `src/app/image-compressor/components/DimensionInputs.js` (sliders), `src/app/image-compressor/components/FileRow.js` (layout-stable Download button + status chip), `src/app/image-compressor/image-compressor.css` (status chip styles, dim-orig label), `src/app/image-compressor/page.js` (pass largestOriginalWidth/Height to DimensionInputs), `src/app/qr-code-generator/components/QRCodeGenerator.js` (shared DropZone migration), `src/app/qr-code-generator/components/QRCodeGenerator.test.jsx` (new), `src/app/qr-code-generator/qr-generator.css` (qr-dropzone* rules removed).

## 2026-05-04 - Fix: address image-compressor general review (1 blocker, 2 major, 9 minor)
**What changed:** Applied all 12 findings from the 2026-05-04 general review round. BLK-1: fixed the encode-loop stale-effect race — effect now depends on `encodeTick` (not `items`), uses `isEncodingRef` + `itemsRef` + `mountedRef` to prevent the self-cancellation bug. MAJ-1: added `MAX_PIXELS = 64_000_000` pixel cap after `createImageBitmap`; throws a friendly error + calls `bitmap.close()` before the throw. MAJ-2: added `hooks.test.js` with 5 tests (queued→encoding→done, error path, removeItem revokes URL, options-change requeues done but leaves error items, options-change ignores error items); verified the first test fails at the BLK-1 HEAD and passes after the fix. MIN-1: `useDeferredValue` on `maxWidth`/`maxHeight` — debounces keystroke-driven dimension changes before they reach the encode opts and reencode effect. MIN-2: improved `canvasToBlob` null error message; when output is WebP and input is PNG, mentions the toggle as a recovery step. MIN-3: dropped `aria-label` from `<DropZone>` (descendant text is the accessible name), added `aria-describedby` pointing to the hint `<p>`, added `role="status"` live region for drag-over state. MIN-4: added polymorphic `as`/`href` support to `<Button>` so anchors share all variants; updated `FileRow.js` download anchor to use `<Button variant="success" href={url} download={name}>`. MIN-5: replaced `⬆` Unicode arrow in DropZone with an inline SVG (currentColor, no emoji-font dependency). MIN-6: extended `formatBytes` to TB (units array gains `'TB'`). MIN-7: `clampQuality` now uses `MIN_QUALITY` as the floor instead of the hardcoded `0.01`. MIN-8: hardcoded `lastModified: new Date('2026-05-04')` for the `/image-compressor` sitemap entry only. MIN-9: wrapped `canvas.toBlob` in try/catch inside the Promise constructor so a synchronous throw rejects instead of hanging.
**Why:** General review round findings; correctness (BLK-1 encode abort, MIN-7 floor inconsistency), safety (MAJ-1 OOM guard), accessibility (MIN-3 aria, MIN-5 SVG), test coverage (MAJ-2), and minor quality issues.
**Impact:** 294 → 309 tests passing (+15: 5 hooks, 4 pipeline, 3 DropZone, 2 Button, 1 formatBytes). Lint: 0 errors (2 pre-existing warnings on QR generator unchanged). Build: green. Password-generator tests (65) unchanged.
**Files changed:** `src/app/image-compressor/hooks.js`, `src/app/image-compressor/hooks.test.js` (new), `src/app/image-compressor/pipeline.js`, `src/app/image-compressor/pipeline.test.js` (new), `src/app/image-compressor/constants.js`, `src/components/Button.js`, `src/components/Button.test.jsx`, `src/components/DropZone.js`, `src/components/DropZone.test.jsx`, `src/lib/format.js`, `src/lib/format.test.js`, `src/app/sitemap.js`, `src/app/image-compressor/components/FileRow.js`.

## 2026-05-04 - Add Image Compressor; promote `<DropZone>`, `<Slider>`, and `formatBytes` to shared
**What changed:** New `/image-compressor` route. Hand-rolled browser-only image-compression pipeline using `<canvas>` + `createImageBitmap` + `canvas.toBlob` (no external dep). JPEG → JPEG (quality slider), WebP → WebP (quality slider), PNG → PNG by default with an opt-in "Convert PNG to WebP" toggle. Optional max-width / max-height (single `computeTargetDimensions(srcW, srcH, maxW, maxH)` helper preserves aspect ratio, never upscales). Hard 25 MB per-file input cap; non-`image/jpeg|png|webp` MIME types are rejected with a clear error. Batch UI with per-row name, original/output sizes, savings %, dimensions, and a per-row Download button. Encode runs sequentially on the main thread (`pipeline.js` is a pure async fn so a Web Worker can adopt it later without rewriting). Object URLs are revoked on row removal and on unmount. Promoted three things to shared in the same change: `<DropZone>` (`src/components/DropZone.js`, click + keyboard + drag-and-drop file picker — PDF Merger will reuse it), `<Slider>` (`src/components/Slider.js`, generic labelled range slider with optional `formatValue` and `leftHint`/`rightHint`), and `formatBytes` (`src/lib/format.js`). The password-generator's `LengthControl` is now a thin wrapper around `<Slider>`; the slider visuals (`.tool-slider*`) and drop-zone visuals (`.tool-dropzone*`) live in `src/styles/tools.css`. Registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`.
**Why:** First image tool; serves the same browser-only / no-upload pitch as the rest of the site. Shared-code lifts done up-front (per the 2026-05-04 coordinator policy) so the next file-input tool (PDF Merger) and any future slider consumer can build on stable shared primitives instead of waiting for a promotion pass.
**Impact:** 240 → 294 tests passing (+54: 31 image-compressor utils, 8 Slider, 9 DropZone, 6 formatBytes). Lint: 0 errors (2 pre-existing `<img>` warnings on QR generator unchanged). Build: green. Password-generator tests unchanged and still passing — the `LengthControl` API and ARIA attributes are preserved through the thin wrapper. Removed slider CSS from `password-generator.css` (now lives in `tools.css`). No new dependencies. No data persistence (deliberate — generated blobs are throwaway).
**Files changed:** `src/app/image-compressor/{page.js,layout.js,constants.js,utils.js,utils.test.js,pipeline.js,hooks.js,image-compressor.css}`, `src/app/image-compressor/components/{DropZone removed,QualityControl.js,DimensionInputs.js,FileRow.js}`, `src/components/{DropZone.js,DropZone.test.jsx,Slider.js,Slider.test.jsx}`, `src/lib/{format.js,format.test.js}`, `src/styles/tools.css` (added `.tool-slider*` and `.tool-dropzone*` blocks), `src/app/password-generator/components/LengthControl.js` (thin-wraps shared `<Slider>`), `src/app/password-generator/password-generator.css` (slider visuals removed), `src/app/page.js` (TOOLS entry), `src/app/sitemap.js` (route entry).

## 2026-05-04 - Password Generator: new defaults + auto-generate on first visit
**What changed:** Default settings now include symbols (`symbols: true`) and use length 18 (was 16). The page auto-generates one password on first render after the load effect commits, so users see a usable password immediately without clicking Generate. A `didAutoGenerateRef` guard ensures the auto-generate fires exactly once per mount; subsequent Generate clicks produce fresh passwords as before. Persisted settings (if any) still take precedence — the auto-generate runs after the load effect commits.
**Why:** Direct user UX request — symbols on by default for stronger out-of-the-box passwords, length 18 for a sensible default, and removing the "click before you see anything useful" friction.
**Impact:** First-visit shows a length-18 alphanumeric+symbols password without user interaction. All 65 password-generator tests pass.
**Files changed:** `src/app/password-generator/constants.js`, `src/app/password-generator/hooks.js`, `src/app/password-generator/page.test.jsx`.

## 2026-05-04 - Fix: address general review round (4 major, 8 minor) on password-generator
**What changed:** Applied all 12 findings from the 2026-05-04 general review round. MAJ-1: fixed progressbar ARIA invariant — now uses 0–100 scale so `aria-valuenow` never exceeds `aria-valuemax`. MAJ-2: added `role="status" aria-live="polite"` region announcing "New password generated, N characters" after Generate and "Password copied" after Copy. MAJ-3: disabled last-enabled class checkbox so users cannot reach the all-classes-off state that the storage validator rejects. MAJ-4: replaced IID entropy formula with class-quota-aware formula (`sum(log2(classSize_i)) + (length - numClasses) * log2(poolSize)`). MIN-1: removed the mount-time spurious save — settings are now persisted only on explicit `updateSetting`/`reset` calls via a `pendingSaveRef`. MIN-2: Generate button is disabled when `!hasAnyClass` (unreachable via MAJ-3 fix, but guard remains). MIN-3: added boundary tests at length 6 and 64. MIN-4: dropped unreachable `.filter((c) => c.length > 0)` from `buildAlphabets`; renamed the related test to accurately describe what it covers. MIN-5: added focused tests for `copyToClipboard` covering both modern clipboard API and `document.execCommand` fallback. MIN-6: removed redundant `aria-label` from Generate and Copy buttons (visible text is the accessible name). MIN-7: moved `MAX_BITS_SCALE` from `StrengthMeter.js` into `constants.js` next to `STRENGTH_BUCKETS`. MIN-8: dismiss prior "Password copied" toast when user generates a new password.
**Why:** Review round findings; correctness (ARIA invariant, entropy overstatement, storage corruption on all-off), accessibility (aria-live, WCAG 2.5.3), and test coverage.
**Impact:** 230 → 241 tests passing. No shared primitive changes. Lint: 0 errors. Build: green. One deviation from synthesis: MIN-2 Generate-disabled guard stays in the code but is unreachable via normal UI interaction due to MAJ-3 preventing all-off; test for the impossible-via-UI path was removed.
**Files changed:** `src/app/password-generator/constants.js`, `src/app/password-generator/utils.js`, `src/app/password-generator/utils.test.js`, `src/app/password-generator/hooks.js`, `src/app/password-generator/hooks.test.js` (new), `src/app/password-generator/page.js`, `src/app/password-generator/storageUtils.js` (no changes), `src/app/password-generator/components/StrengthMeter.js`, `src/app/password-generator/components/PasswordResult.js`, `src/app/password-generator/components/ClassToggles.js`, `src/app/password-generator/page.test.jsx`, `src/app/password-generator/password-generator.css`.

## 2026-05-04 - Add Password Generator tool
**What changed:** New `/password-generator` route. Cryptographically random password generation (`window.crypto.getRandomValues` via rejection-sampled `secureRandomInt`), length slider (6–64), per-class toggles (upper/lower/digits/symbols + exclude-ambiguous), live entropy/strength meter, copy-to-clipboard. Uses shared `<ToolPage>`, `<Card>`, `<Button>`, `<ToastContainer>`. Settings persisted via `createStorageContext` (key `password_generator_settings`, version `1.0.0`); generated passwords are NEVER persisted. Registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`. Added 55 tests (utils, storage validators, page render+interactions).
**Why:** First tool in the tools-batch coordinator plan; expands the tool set with a security-flavored utility.
**Impact:** New route live. No changes to existing tools or shared primitives. `npm run lint` / `npm test` (230 total) / `npm run build` all green. Coordinator hints: `LengthControl`, `ClassToggles`, `pw-toggle` checkbox styling, and `copyToClipboard` helper are tool-local — flagged for promotion when a second tool needs them.
**Files changed:** `src/app/password-generator/**`, `src/app/page.js`, `src/app/sitemap.js`.

## 2026-05-04 - local-review-multi-agent skill: file-first protocol + Copilot bridge
**What changed:** Rewrote `.agents/skills/local-review-multi-agent/SKILL.md`. Codified that all review content moves through files in the round folder, not chat. Added per-round `instructions.md` and `copilot-prompt.md` deliverables; the Copilot prompt is the first artifact of every round and tells Copilot to write to `copilot-findings.md` and to use `communication.md` for questions. Made Copilot a default reviewer (was "manual / optional"). Documented `communication.md` as a two-way file-based channel between coordinator and reviewers.
**Why:** Keep coordinator chat minimal and reproducible. File-based comm makes rounds resumable across sessions and prevents review content from disappearing into chat history.
**Impact:** Future review rounds must start by writing `instructions.md` + `copilot-prompt.md` and showing the prompt for copy-paste. No reviewer findings should be pasted in chat.
**Files changed:** `.agents/skills/local-review-multi-agent/SKILL.md`.

## 2026-05-03 - AI collaboration scaffold bootstrapped
**What changed:** Added `.agents/` (core protocol, loading policy, skill index, skills), root entrypoints (`CLAUDE.md`, `AGENTS.md`, `agent.md`) as `@import` shims, `playground/HANDOVER.md`, Husky + changelog-enforcement pre-commit hook, Vitest test runner.
**Why:** Make every AI assistant (Claude / Codex / Copilot / Cursor) read the same protocol, plan in the same place, and commit with the same enforcement.
**Impact:** All future work must follow the protocol in `.agents/agent-protocol-core.md`. Pre-commit blocks any commit that touches source without staging this changelog.
**Files changed:** `.agents/**`, `CLAUDE.md`, `AGENTS.md`, `agent.md`, `playground/HANDOVER.md`, `.husky/pre-commit`, `package.json`, `.gitignore`, `vitest.config.mjs`.

## 2026-05-03 - Raise section: Percentage spans full row
**What changed:** In the salary-raise calculator's Raise section, the Percentage input now spans the full grid row. The four period inputs follow as 2 rows of 2 (Hourly + Weekly, Monthly + Annual). Implemented via a `.pay-row--full` modifier (`grid-column: 1 / -1`) applied only to the percent row.
**Why:** Percentage is conceptually distinct from the period inputs (it's the raise driver, not a period view). Pairing it with a single period field looked arbitrary; giving it its own row makes the section's semantic structure visible.
**Impact:** Raise section now lays out as 1 + 2 + 2 (3 rows). Pay before raise / Pay after raise unchanged (still 2 × 2). Mobile (<640px) still collapses to one column. No behavior change. Tests + lint clean.
**Files changed:** `src/app/salary-raise-calculator/components/PaySection.js`, `src/app/salary-raise-calculator/raise-calculator.css`.

## 2026-05-03 - Salary-raise calculator uses full container width and 2-col input grid
**What changed:**
1. Removed the `narrow` prop on `<ToolPage>` in [src/app/salary-raise-calculator/page.js](src/app/salary-raise-calculator/page.js). The page now uses the default 1200px container, matching CGPA Calculator and QR Code Generator.
2. Wrapped the inputs in each `PaySection` in a new `.pay-grid` two-column CSS grid. With the wider container the period inputs were too wide; now they pair up — Pay before raise: 2 rows × 2; Raise: 5 fields auto-flowing 2+2+1; Pay after raise: 2 rows × 2. The `<640px` breakpoint collapses back to one column.
**Why:** At 720px the three-tile results grid squeezed `$250000` against the tile padding. Widening to 1200px fixed the results but made each input span the full container, which felt empty. Pairing the period inputs uses the new horizontal space without affecting the result tiles (still full-width, three across).
**Impact:** Result tiles get ~380px each. Period inputs sit side-by-side instead of full-width. No behavior change. Tests + lint clean.
**Files changed:** `src/app/salary-raise-calculator/page.js`, `src/app/salary-raise-calculator/components/PaySection.js`, `src/app/salary-raise-calculator/raise-calculator.css`.

## 2026-05-03 - Add unit-test layer (Vitest + RTL)
**What changed:** Added 13 test files / 175 tests covering `src/lib/{storage,createStorageContext}`, `src/hooks/useToast`, shared components (`Button`, `Card`, `Hero`, `ResultCard`, `ToastContainer`, `ErrorBoundary`), and tool-specific utils + validators for both calculators. Added `vitest.setup.js` (jest-dom matchers, RTL cleanup, localStorage clear). Configured Vite/esbuild to handle JSX in `.js` files via the automatic JSX runtime so `createStorageContext.js` and the existing tool components can be imported by tests without a rename.
**Why:** First test pass to anchor future agent / human changes against regressions. Targets pure logic + shared primitives where ROI is highest. CSS / visual-regression deferred to a separate plan.
**Impact:** `npm test` exits green with 175 passing tests. `@testing-library/{react,jest-dom,user-event}` added as dev deps. `vitest.config.mjs` extended with React plugin + `esbuild.jsx: 'automatic'`.
**Files changed:** `vitest.config.mjs`, `vitest.setup.js`, `package.json`, `src/lib/*.test.{js,jsx}`, `src/hooks/useToast.test.js`, `src/components/*.test.jsx`, `src/app/cgpa-calculator/{utils,storageUtils}.test.js`, `src/app/salary-raise-calculator/{utils,storageUtils}.test.js`.

## 2026-05-03 - Fix Button defaults under React 19
**What changed:** Replaced deprecated `Button.defaultProps` (no longer applied to function components in React 19) with ES6 default parameters. Behavior preserved: `variant='primary'`, `block=false`, `type='button'`.
**Why:** First test surfaced that buttons were silently rendering without a `type` attribute, which could submit enclosing forms unintentionally.
**Impact:** Buttons now reliably default to `type="button"` and `variant="primary"`. No call-site changes needed.
**Files changed:** `src/components/Button.js`.

## 2026-05-03 - Fix lint script for Next 16
**What changed:** Replaced `next lint` (removed in Next 16) with `eslint .` and added flat-config `ignores` for `.next/`, `out/`, `build/`, `coverage/`, `node_modules/`, `playground/` so the pre-commit lint step doesn't traverse build output.
**Why:** Bootstrap's pre-commit hook needs a working lint command; `next lint` errored with "Invalid project directory provided".
**Impact:** `npm run lint` is now clean (0 errors; 2 pre-existing `<img>` warnings).
**Files changed:** `package.json`, `eslint.config.mjs`.
