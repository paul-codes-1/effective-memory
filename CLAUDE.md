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
- `npx vitest run src/data/utils.test.ts` — run a single unit test file
- `npx playwright test e2e/navigation.spec.ts` — run a single e2e test file
- `npx playwright test --project=mobile-chrome` — run e2e tests on mobile viewport only

## Data Pipeline

Source CSV (`combined_contributors.csv`) → Python script (inline in README or `sum_contributions.py`) → JSON files in `public/data/`. The app fetches these JSON files at runtime.

Key data files:
- `public/data/contributors.json` — historical (2022-2024) filtered contribution records
- `public/data/contributor_totals.json` — precomputed rollups for the historical dataset
- `public/data/2026-lfucg-primary-contributions.json` — LFUCG 2026 primary contributions
- `public/data/2026-primary.json` — 2026 primary data

## Architecture

The app has two parallel portals sharing a similar structure but with separate components:

1. **LFUCG 2026 portal** (`/`) — the root portal. Uses `useLfucgContributors` hook, `LfucgLayout` component, MUI theme from `lfucgTheme.ts`, and route pages in `src/routes/lfucg/`. Includes employer detail routes.
2. **Historical portal** (`/archive/*`) — archived 2022-2024 data. Uses `useContributors` hook, `Layout` component (with ARCHIVED badge), and route pages in `src/routes/`.

Old `/lfucg/*` URLs are redirected to their root equivalents via `LfucgRedirect` in `App.tsx`.

Both portals use React Context providers to load and share contribution data across their routes. The pattern is: a provider fetches JSON, maps raw records to typed `ContributorRecord` objects, and exposes them via context. `ContributorsProvider` is scoped to the archive route block only (not app-wide) to avoid loading historical data on LFUCG pages.

### Key patterns
- **Routing**: `react-router-dom` v6 with nested `<Routes>` in `App.tsx`
- **UI**: Material UI (`@mui/material`) with Emotion styling, `responsiveFontSizes()` on both themes
- **Responsive tables**: `ResponsiveTable` component renders MUI Table on md+ screens and a card-list layout on mobile. Column definitions use `primary`, `highlight`, and `hideOnMobile` flags.
- **Data flow**: Context providers (`ContributorsProvider` / `LfucgContributorsProvider`) wrap each portal's routes. Pages consume data via `useContributors()` / `useLfucgContributors()` hooks.
- **Data mapping**: Raw JSON records are mapped to typed `ContributorRecord` objects via pure `mapRecord` / `mapLfucgRecord` functions in `src/data/`. Shared helpers (`normalize`, `parseAmount`, `buildFullName`) live in `src/data/utils.ts`.
- **Slug-based detail routes**: Contributors, recipients, and employers have detail pages at `/:slug` using a `slugify` function to match URL params to data keys.
- **Table sorting**: Reusable `useTableSort` hook for sortable tables.
- **Types**: All data types are defined in `src/data/types.ts`. Utility functions in `src/data/utils.ts`.