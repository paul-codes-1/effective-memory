// filter-lexington-urban.js
// Reads EVERY export_contributor_*.csv in the repo root (one per 2026 election:
// the 5/19 primary and the 11/3 general), filters rows where Location includes
// "LEXINGTON-URBAN", drops Contribution Mode == TRANSFER rows (a candidate's
// unspent primary balance moved into their general committee — the same dollars
// already counted as primary contributions), and writes the union to
// 2026-lfucg-primary-contributions.json (filename kept for the app + Amplify).
//
// Also writes meta.json (freshness stamp for the UI):
//   { generatedAt, latestReceiptDate, recordCount, elections: [{date, type, records}] }
// meta.json is rewritten ONLY when the data JSON actually changes (or is missing),
// so a no-change weekly run leaves the working tree clean and the refresh
// script's `git diff --quiet` check still short-circuits.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.join(__dirname, '2026-lfucg-primary-contributions.json');
const metaPath = path.join(__dirname, 'meta.json');

// Parse a CSV per RFC 4180 (quoted fields, embedded commas, "" escapes, CRLF).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        // skip; \n will terminate the row
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const numericFields = new Set(['Amount', 'Number Of Contributors']);
// Zip can be numeric or empty; existing JSON stores it as a number when present.
const zipField = 'Zip';

function coerce(header, value) {
  if (header === zipField) {
    if (value === '' || value == null) return '';
    const n = Number(value);
    return Number.isFinite(n) && String(n) === String(value).replace(/^0+/, '') ? n : value;
  }
  if (numericFields.has(header)) {
    if (value === '' || value == null) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value ?? '';
}

function findCsvs() {
  const entries = fs.readdirSync(repoRoot);
  const matches = entries
    .filter(name => name.startsWith('export_contributor_') && name.endsWith('.csv'))
    .sort();
  if (matches.length === 0) {
    console.error(`No export_contributor_*.csv file found in ${repoRoot}`);
    process.exit(1);
  }
  return matches.map(name => path.join(repoRoot, name));
}

// KREF dates are M/D/YYYY (sometimes with a trailing time). Returns YYYY-MM-DD or null.
function toIsoDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(value || '').trim());
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

export function buildMeta(records, generatedAt) {
  const today = generatedAt.slice(0, 10);
  let latest = null;
  const elections = new Map();
  for (const r of records) {
    const d = toIsoDate(r['Receipt Date']);
    // Ignore obviously mistyped future receipt dates.
    if (d && d <= today && (!latest || d > latest)) latest = d;
    const date = toIsoDate(r['Election Date']) || String(r['Election Date'] || '');
    const key = `${date}|${r['Election Type'] || ''}`;
    const e = elections.get(key) || { date, type: r['Election Type'] || '', records: 0 };
    e.records++;
    elections.set(key, e);
  }
  return {
    generatedAt,
    latestReceiptDate: latest,
    recordCount: records.length,
    elections: [...elections.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function main() {
  const filtered = [];
  let dropped = 0;
  for (const inputPath of findCsvs()) {
    console.log(`Reading ${inputPath}`);
    const text = fs.readFileSync(inputPath, 'utf8');
    const rows = parseCsv(text);
    if (rows.length === 0) {
      console.error(`CSV is empty: ${inputPath}`);
      process.exit(1);
    }
    const headers = rows[0];
    const locationIdx = headers.indexOf('Location');
    const modeIdx = headers.indexOf('Contribution Mode');
    if (locationIdx === -1) {
      console.error(`No "Location" column in ${inputPath}`);
      process.exit(1);
    }
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 1 && row[0] === '') continue; // trailing blank line
      const location = row[locationIdx] || '';
      if (!location.includes('LEXINGTON-URBAN')) continue;
      if (modeIdx !== -1 && (row[modeIdx] || '') === 'TRANSFER') {
        dropped++;
        continue;
      }
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        obj[headers[c]] = coerce(headers[c], row[c] ?? '');
      }
      filtered.push(obj);
    }
  }

  const json = JSON.stringify(filtered, null, 2);
  const previous = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null;
  const changed = previous !== json;
  if (changed) fs.writeFileSync(outputPath, json, 'utf8');
  console.log(
    `Filtered ${filtered.length} rows (dropped ${dropped} carryover transfers) -> ${outputPath}` +
      (changed ? '' : ' (unchanged)'),
  );

  if (changed || !fs.existsSync(metaPath)) {
    // Unchanged data but no meta yet (first run): stamp with the data file's
    // last write time rather than "now", so "refreshed" reflects the real pull.
    const generatedAt = changed ? new Date().toISOString() : fs.statSync(outputPath).mtime.toISOString();
    const meta = buildMeta(filtered, generatedAt);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${metaPath} (latest receipt ${meta.latestReceiptDate})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
