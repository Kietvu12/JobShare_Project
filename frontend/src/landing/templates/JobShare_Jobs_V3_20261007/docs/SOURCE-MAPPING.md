# Source / data / API mapping

Reference: supplied `JobShare - List Jobs(4).rar`, original production bundle `index-Cf0gXuzG.js.download`. Visual base: supplied `JobShare_Jobs_V2_20261007(1).zip`.

| Area | Original source | V3 implementation |
|---|---|---|
| Category tree | `/api_jobshare/api/ctv/job-categories/tree` | Preserved `dist/categories.json` with name/nameEn/nameJp |
| Root checkbox | Tze / Ae: fieldIds independent, deselect prunes branch | `toggleCategory(..., true)`; pruning covers all descendants rather than only immediate children |
| Subgroup checkbox | Tze / Pe: Te subtree, any checked → remove branch | `toggleCategory(..., false)` |
| Leaf | Tze / Fe independent toggle | Single ID branch |
| API categories | Advanced filter yn: jobTypeIds priority, else expand fields; join comma | `categoryQueryIds`, wire `jobCategoryIds=...` |
| API locations | Advanced filter yt, delimiter `|||` | `serializeLocations`; source-derived aliases for legacy bare city names |
| Country | Tze / de enables picker, removal clears that country's entries | Enable country, navigate separately; no invented whole-country query |
| Japan hierarchy | 8 source regions, Yf prefectures; d5 municipality grouping | `regions.json`, `prefectures.json`, `japan/*.json`, `location-master.json` |
| Japan source | https://madefor.github.io/jisx0402/api/v1/{01..47}.json | All 47 snapshots fetched 2026-10-07; dedup city names, group `^(.+市)(.+区)$` |
| Japan wire objects | Se: country, location, locationJp, jpId | Same structured object, preserved in UI URL |
| Romaji | Fw in original bundle | Extracted unchanged to `romaji.js`; build-time labels |
| Vietnam | Nze constant | Exact 63 province/city strings, no districts/wards in this public picker |

The original public listings component forwarded only the first selected category and first location. V3 intentionally repairs that truncation using the existing multi-value format already present in the same source bundle. Read-only public API calls confirmed `jobCategoryIds=94,104` returns both categories, and `locations=Meguroku|||Hachioujishi` returns both places. See `api-verification.json`.

UI URL uses `fieldIds=comma IDs`, `jobTypeIds=comma IDs`, and `locations=JSON array` to retain the original filter object's distinct fields, including Japanese IDs. This URL is frontend state, not an invented backend schema. `queryFor()` alone converts it to the verified backend wire parameters.

A source-data constraint remains: legacy job records may have bare municipality names and no prefecture/country metadata. Aliases preserve recall, but same-name municipalities cannot always be geographically disambiguated by this text-only API. No location records or job attributes were fabricated.
