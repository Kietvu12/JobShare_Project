# V3 QA · 2026-10-07

## Passed automated checks

`node tests-v3.mjs`: root independent selection, child subtree toggle, leaf toggle, immutable committed state, draft isolation, category API precedence, subtree expansion, multi-location add/remove, URL round-trip, legacy category migration, actual multi-value API serialization, 47 prefectures, 1.901 distinct municipality/ward entries, 63 Vietnam province/city entries, Mie in Kinki as source, 18 SSR cards per locale, support removed, standalone JS syntax, salary periods.

`node --check dist/app.js` and `node --check dist/picker.js`: passed.

Read-only API integration: see `api-verification.json`. Both selected categories and both selected place names appear in results. No login or write operation against JobShare was performed.

## Not verified: browser interaction and screenshots

Managed preview infrastructure failed with `bwrap: Can't mount proc on /newroot/proc: Operation not permitted`. Supervisor status: stopped. File navigation also disallowed by the browser. No alternate server/browser workaround was used.

The following acceptance items remain **pending**, not passed:

1. Desktop category default.
2. Parent + child + grandchild selected; indeterminate branch; clear, cancel, confirm.
3. Japan country → region → prefecture → municipality/ward.
4. Vietnam province/city list.
5. Multi-location across Japan/Vietnam, shared hero/sidebar trigger, independent removable chips.
6. VI hero at 1024/1280/1440 desktop.
7. EN hero at 1024/1280/1440 desktop.
8. JA hero, punctuation/kinsoku and all static headings by eye.
9. Mobile category, Back without selection loss, keyboard focus/ESC.
10. Mobile location, nested navigation, sticky footer, no horizontal overflow.

Old screenshots are kept in `reference-v2-screenshots/` only for visual comparison. They must not be cited as V3 screenshot evidence.
