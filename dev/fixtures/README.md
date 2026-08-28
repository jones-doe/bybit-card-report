# Test fixtures

`assetRecords.json` — 364 synthetic card records in the exact shape Bybit
sends (numbers as strings, scientific notation, padded merchant/city names),
spanning ~5 months up to generation date. Regenerate with:

```bash
python3 dev/fixtures/generate_asset_records.py
```

Covers every code path by hand, not just random volume:

- `side` 1 (Authorization hold), 3 (Transaction), 5 (Refund), 6 (Chargeback)
- a purchase+refund pair on the same merchant (the PEGASUS shape that first
  showed `side` is a numeric code, not a word)
- a record with no USD field anywhere → "нет USD" / `unresolvedCount`
- 9 MCC categories, so the categorical fold to "Прочее" triggers
- one category (Продукты, MCC 5411) with 10 merchants, so the per-category
  merchant fold ("ещё N") triggers
- a deliberately large day so the calendar heat scale spans all 5 steps

Nothing here is imported by `src/`, so it never reaches the production bundle
— `tsconfig.app.json` scopes to `src` and Vite only bundles what `main.tsx`
actually imports.

## Loading it

In the browser tab (javascript_tool or the real console):

```js
const { installFixtures } = await import('/dev/fixtures/install.ts')
await installFixtures()
location.reload()
```

Writes credentials and a pre-hydrated react-query cache straight to
`localStorage` — the app never calls the API, so this works offline and skips
signing and rate limiting entirely.

```js
const { clearFixtures } = await import('/dev/fixtures/install.ts')
clearFixtures()
location.reload()
```

removes exactly what `installFixtures` wrote and nothing else.
