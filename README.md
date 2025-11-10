# Contributors Dashboard

A Vite + React single-page app for exploring the local political contributor dataset. It loads the `public/data/contributors.json` file that was generated from `combined_contributors.csv` and surfaces it through multiple routed views (overview KPIs, searchable contributor table, and recipient rollups).

## Getting started

```bash
npm install
npm run dev
```

The development server runs on <http://localhost:5173>. The contributors JSON file is served statically from `public/data/contributors.json`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build locally. |

## Regenerating the JSON data

If the CSV changes, regenerate the JSON file before rebuilding the app:

```bash
python - <<'PY'
import csv, json, pathlib
rows = []
with open('combined_contributors.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        to_org = (row.get('To Organization') or '').strip().lower()
        location = (row.get('Location') or '').strip().lower()
        city = (row.get('City') or '').strip().lower()
        if to_org == 'protect lex' or 'lexington' in location or 'lexington' in city:
            rows.append(row)
pathlib.Path('public/data/contributors.json').write_text(json.dumps(rows, indent=2))
print(f"Wrote {len(rows)} rows to public/data/contributors.json")
PY
```

## Project structure

```
.
├── combined_contributors.csv        # original source data
├── public/data/contributors.json    # JSON served to the React app
├── src
│   ├── App.tsx                      # routing + layout wiring
│   ├── components                   # layout + inputs
│   ├── hooks/useContributors.tsx    # data provider + mapping logic
│   ├── routes                       # Overview, Contributors, Recipients pages
│   └── data/types.ts                # Type definitions
├── index.html                       # Vite entry point
└── vite.config.ts                   # Vite configuration
```

## Notes

- The dataset includes any filing where the `To Organization` is “Protect Lex” **or** the `Location`/`City` contains “Lexington”.
- The contributors page intentionally caps the rendered table at 500 rows for responsiveness—narrow the filters to explore more targeted slices.
- The recipients page aggregates records by recipient and exposes quick filters for office sought.
- Click any contributor or recipient to drill into a detail route that lists every matching contribution.
- Amount totals are net values, so refunds or debt assumptions appear as negative numbers.
