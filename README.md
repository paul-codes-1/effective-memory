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
import csv, json, pathlib, re
from collections import defaultdict

def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or 'unknown'

rows = []
totals = defaultdict(lambda: {'fullName': '', 'totalAmount': 0.0, 'contributionCount': 0})

with open('combined_contributors.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        to_org = (row.get('To Organization') or '').strip().lower()
        location = (row.get('Location') or '').strip().lower()
        city = (row.get('City') or '').strip().lower()
        if to_org == 'protect lex' or 'lexington' in location or 'lexington' in city:
            rows.append(row)

            first = (row.get('Contributor First Name') or '').strip()
            last = (row.get('Contributor Last Name') or '').strip()
            from_org = (row.get('From Organization Name') or '').strip()
            full_name = ' '.join(part for part in [first, last] if part).strip() or from_org or 'Unknown contributor'
            key = slugify(f\"{first} {last}\" if first or last else from_org)

            try:
                amount = float(row.get('Amount') or 0)
            except ValueError:
                amount = 0.0

            totals[key]['fullName'] = full_name
            totals[key]['totalAmount'] += amount
            totals[key]['contributionCount'] += 1

pathlib.Path('public/data/contributors.json').write_text(json.dumps(rows, indent=2))
pathlib.Path('public/data/contributor_totals.json').write_text(json.dumps(totals, indent=2))
print(f"Wrote {len(rows)} rows to public/data/contributors.json")
print(f"Wrote {len(totals)} contributors to public/data/contributor_totals.json")
PY
```

## Project structure

```
.
├── combined_contributors.csv        # original source data
├── public/data/contributors.json    # filtered filings served to the app
├── public/data/contributor_totals.json # precomputed contributor rollups
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
- Contributor totals load from `public/data/contributor_totals.json`, powering the default totals view and sort on the Contributors page.
- The contributors page intentionally caps the rendered table at 500 rows for responsiveness—narrow the filters to explore more targeted slices.
- Use the “Show grouped dates” control on the Contributors page to fan out a filtered set and see per-day totals for each contributor.
- The recipients page aggregates records by recipient and exposes quick filters for office sought.
- Click any contributor or recipient to drill into a detail route that lists every matching contribution.
- Amount totals are net values, so refunds or debt assumptions appear as negative numbers.
