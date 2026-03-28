# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Vite + React + TypeScript single-page app for exploring LFUCG (Lexington-Fayette Urban County Government) campaign contribution data. It loads JSON data files from `public/data/` and presents them through multiple routed views with search, filtering, and drill-down.

## Commands

- `npm run dev` — start dev server on localhost:5173
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build locally
- `npm test` — run unit tests in watch mode (Vitest)
- `npm run test:unit` — run unit tests once
- `npm run test:e2e` — run Playwright e2e tests (auto-starts dev server)
- `npm run test:e2e:ui` — run Playwright tests with interactive UI
- `npm run lint` — run ESLint on src/
- `npm run lint:fix` — run ESLint with auto-fix
- `npm run format` — format src/ with Prettier
- `npm run format:check` — check formatting without writing
- `npx vitest run src/data/utils.test.ts` — run a single unit test file
- `npx playwright test e2e/navigation.spec.ts` — run a single e2e test file
- `npx playwright test --project=mobile-chrome` — run e2e tests on mobile viewport only

## Pre-commit Hooks

Husky + lint-staged enforces on every commit:
1. **lint-staged** — ESLint (auto-fix) + Prettier on staged `.ts`/`.tsx`/`.css` files
2. **vitest** — all unit tests must pass or commit is blocked

## Data Pipeline

Source CSV (`combined_contributors.csv`) → Python script (inline in README or `sum_contributions.py`) → JSON files in `public/data/`. The app fetches these JSON files at runtime.

Key data files:
- `public/data/contributors.json` — historical (2022-2024) filtered contribution records
- `public/data/contributor_totals.json` — precomputed rollups for the historical dataset
- `public/data/2026-lfucg-primary-contributions.json` — LFUCG 2026 primary contributions

## Architecture

The app has two parallel portals sharing a similar structure but with separate components:

1. **LFUCG 2026 portal** (`/`) — the root portal. Uses `useLfucgContributors` hook, `LfucgLayout` component, MUI theme from `lfucgTheme.ts`, and route pages in `src/routes/lfucg/`. Includes employer detail routes.
2. **Historical portal** (`/archive/*`) — archived 2022-2024 data. Uses `useContributors` hook, `Layout` component (with ARCHIVED badge), and route pages in `src/routes/`.

Old `/lfucg/*` URLs are redirected to their root equivalents via `LfucgRedirect` in `App.tsx`.

Both portals use React Context providers to load and share contribution data across their routes. `ContributorsProvider` is scoped to the archive route block only (not app-wide) to avoid loading historical data on LFUCG pages.

### Data layer (`src/data/`)

Pure, independently testable modules — no React dependencies:

- **`types.ts`** — `ContributorRecord`, `ContributorTotal`, `ContributorTotalsMap`, `RawContributorRecord`
- **`utils.ts`** — `slugify`, `normalize`, `parseAmount`, `buildFullName`, `normalizeEmployerKey`, `buildIdentityKey`
- **`mapRecord.ts`** — maps raw historical JSON records to `ContributorRecord`
- **`mapLfucgRecord.ts`** — maps raw LFUCG JSON records to `ContributorRecord` with identity key logic for CANDIDATE/UNITEMIZED/ANONYMOUS/CASH contribution types
- **`aggregateTotals.ts`** — builds `ContributorTotalsMap` from mapped records, keyed by `identityKey`
- **`overviewAggregation.ts`** — computes summary KPIs, top recipients, top employers
- **`filterContributors.ts`** — search/type/mode filtering, sorting for records and totals

### Data normalization

Employer normalization (`normalizeEmployerKey`):
- Alias map canonicalizes variants: FCPS/Fayette County Public Schools, KBJ/Kbj, GALLS/Galls, etc.
- "Self Employed, X" compounds are parsed to extract the real employer (e.g., "Self Employed, Guide Realty" → "guide realty")
- Retired, N/A, Not Employed, and bare "Self Employed" are excluded from employer aggregation

Contributor identity (`buildIdentityKey`):
- Named contributors: slugified full name (groups multiple filings by same person)
- CANDIDATE (self-funding): `candidate-self-{recipient}` (scoped per candidate)
- UNITEMIZED (small-dollar bundles): `unitemized-{recipient}` (scoped per recipient)
- ANONYMOUS: `anonymous-{index}` (unique per record)
- CASH (unnamed): `cash-unnamed-{index}` (unique per record)

### Key patterns

- **Routing**: `react-router-dom` v6 with nested `<Routes>` in `App.tsx`
- **UI**: Material UI (`@mui/material`) with Emotion styling, `responsiveFontSizes()` on both themes
- **Responsive tables**: `ResponsiveTable` component renders MUI Table on md+ screens and a card-list layout on mobile. Column definitions use `primary`, `highlight`, and `hideOnMobile` flags.
- **Slug-based detail routes**: Contributors, recipients, and employers have detail pages at `/:slug` using `slugify` to match URL params to data keys.
- **Table sorting**: Reusable `useTableSort` hook for sortable tables.

## Testing

### Unit tests (`src/**/*.test.ts`)

114 tests across 7 files. Run with `npm run test:unit`. Cover:
- All data utility functions (slugify, employer normalization, identity keys)
- Both record mappers (historical + LFUCG)
- Totals aggregation (grouping, refunds, cross-sum integrity)
- Overview computation (KPIs, employer merge, top recipients)
- Filtering and sorting (search, type/mode, combined, sort correctness)
- `useTableSort` hook state transitions

### E2E tests (`e2e/*.spec.ts`)

60 tests across 7 specs. Run with `npm run test:e2e`. Run on both desktop Chrome and mobile Chrome. Cover:
- Route navigation and `/lfucg` backward-compat redirects
- Overview data integrity (stat cards, tables, links)
- Contributors page (search, filters, sort, view toggle)
- Contributor/recipient detail drill-down
- Responsive behavior (cards vs tables on mobile)
- Cross-page data consistency (overview total = contributors total)

### Test fixtures

`src/test/fixtures/contributors.ts` — raw records + auto-generated mapped records via `mapLfucgRecord`. Covers: normal names, org-only, anonymous, CANDIDATE, UNITEMIZED, refunds, zero amounts, and in-kind contributions.
