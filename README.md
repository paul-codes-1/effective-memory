# Contributors Dashboard

A Vite + React single-page app for exploring local political contributor data. The 2026 LFUCG Primary Election portal is the main experience at `/`, with historical 2022-2024 data archived at `/archive`.

## Getting started

```bash
npm install
npm run dev
```

The development server runs on <http://localhost:5173>.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests in watch mode (Vitest) |
| `npm run test:unit` | Run unit tests once |
| `npm run test:e2e` | Run Playwright e2e tests (auto-starts dev server) |
| `npm run test:e2e:ui` | Run Playwright tests with interactive UI |
| `npm run lint` | Run ESLint on src/ |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format src/ with Prettier |
| `npm run format:check` | Check formatting without writing |

### Running a single test

```bash
# Single unit test file
npx vitest run src/data/utils.test.ts

# Single e2e test file
npx playwright test e2e/navigation.spec.ts

# Mobile-only e2e tests
npx playwright test --project=mobile-chrome
```

## Pre-commit hooks

The project uses [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) to enforce code quality on every commit:

1. **lint-staged** — runs ESLint (with auto-fix) and Prettier on staged `.ts`/`.tsx`/`.css` files
2. **vitest** — runs all unit tests; commit is blocked if any test fails

## Testing

### Unit tests (Vitest)

97 tests across 7 test files covering:

- **Data utilities** — `slugify`, `normalizeEmployerKey`, `normalize`, `parseAmount`, `buildFullName`
- **Record mapping** — LFUCG mapper (identity keys, anonymous handling, attribution notes) and historical mapper
- **Aggregation** — totals accumulation, grouping by identity key, refund handling, cross-sum integrity
- **Overview computation** — summary KPIs, top recipients, employer merge (FCPS variants)
- **Filtering & sorting** — search, type/mode filters, combined filters, sort correctness, immutability
- **useTableSort hook** — state transitions, toggle, reset

### E2E tests (Playwright)

60 tests across 7 spec files running on both desktop Chrome and mobile Chrome:

- **Navigation** — all routes load, `/lfucg` backward-compat redirects work
- **Overview data** — stat cards render real numbers, tables have rows, links navigate correctly
- **Contributors** — search, filters, sort, view toggle (Totals/Records)
- **Contributor detail** — drill-down, back link, contribution history
- **Recipients** — search, office filter, sort, drill-down
- **Responsive** — mobile renders cards not tables, hamburger menu works
- **Data consistency** — cross-page total verification (overview total = contributors total = recipients sum)

## Code quality

- **ESLint** with `@typescript-eslint`, `react-hooks`, `react-refresh`, and `prettier` plugins
- **Prettier** with single quotes, trailing commas, 120 char print width

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
            key = slugify(f"{first} {last}" if first or last else from_org)

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
├── public/data/                     # JSON data files served to the app
│   ├── contributors.json            # historical (2022-2024) filtered filings
│   ├── contributor_totals.json      # precomputed historical contributor rollups
│   └── 2026-lfucg-primary-contributions.json  # LFUCG 2026 primary data
├── src
│   ├── App.tsx                      # routing (LFUCG at /, archive at /archive/*)
│   ├── components/                  # layout, inputs, ResponsiveTable
│   ├── data/                        # types, utils, mappers, aggregation, filtering
│   ├── hooks/                       # data providers, useTableSort
│   └── routes/                      # page components (root + lfucg/)
├── e2e/                             # Playwright e2e test specs
├── vitest.config.ts                 # Vitest configuration
├── playwright.config.ts             # Playwright configuration
└── .eslintrc.cjs                    # ESLint configuration
```

## Notes

- The LFUCG 2026 portal is the root experience (`/`). Historical data lives at `/archive/*`.
- Old `/lfucg/*` URLs redirect to their root equivalents for backward compatibility.
- The dataset includes any filing where the `To Organization` is "Protect Lex" **or** the `Location`/`City` contains "Lexington".
- Contributor totals for the LFUCG portal are computed at runtime from the raw data using `identityKey` for deduplication.
- The contributors page caps the rendered table at 500 rows for responsiveness.
- On mobile (<900px), tables switch to a card-list layout via the `ResponsiveTable` component.
- Amount totals are net values, so refunds or debt assumptions appear as negative numbers.
